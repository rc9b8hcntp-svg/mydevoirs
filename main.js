const { app, BrowserWindow, ipcMain, Menu, shell, Notification, Tray, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { checkForUpdate, listReleases } = require('./updater');
const { downloadFile } = require('./downloader');
const { normalizeSettings, buildDigest, isDue, ymd } = require('./notifier');
const backup = require('./backup');

// Nécessaire pour que Windows affiche correctement les notifications de l'appli
app.setAppUserModelId('fr.maxence.mesdevoirs');

const ICON_PATH = path.join(__dirname, 'build', 'icon.png');
const dataFile = () => path.join(app.getPath('userData'), 'devoirs.json');
const notifStateFile = () => path.join(app.getPath('userData'), 'notifications-state.json');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let lastAsset = null;   // installeur (.msi) correspondant à ce PC, trouvé par la dernière recherche de mise à jour
let downloading = false;
const ASSET_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\/[^/\s]+\/[\w.+-]+\.msi$/i;
const liveNotifications = new Set(); // évite que Windows/Electron les « oublie » avant le clic

// ---------- Données ----------
function readData() {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      homework: Array.isArray(parsed.homework) ? parsed.homework : [],
      settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {},
    };
  } catch (e) {
    return { homework: [], settings: {} };
  }
}

function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function writeData(data) {
  writeJson(dataFile(), data);
}

// État interne des notifications (dernier rappel envoyé…), séparé des données de l'utilisateur
function readNotifState() {
  try {
    const s = JSON.parse(fs.readFileSync(notifStateFile(), 'utf8'));
    return s && typeof s === 'object' ? s : {};
  } catch (e) {
    return {};
  }
}

function writeNotifState(state) {
  try { writeJson(notifStateFile(), state); } catch (e) { /* pas grave */ }
}

function notifSettings() {
  return normalizeSettings(readData().settings.notifications);
}

// ---------- Fenêtre ----------
function createWindow(startHidden) {
  const win = new BrowserWindow({
    width: 980,
    height: 700,
    minWidth: 420,
    minHeight: 420,
    title: 'Mes Devoirs',
    backgroundColor: '#f5f6fa',
    icon: ICON_PATH,
    show: !startHidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());

  // Fermer la fenêtre avec l'option « rester en arrière-plan » : on laisse la fenêtre se fermer vraiment
  // (l'appli reste active dans la zone de notification). Ainsi, quand on la rouvre, c'est une nouvelle
  // fenêtre et Windows rejoue sa vraie animation d'ouverture (ce que ne fait pas un simple hide/show).
  win.on('close', () => {
    if (isQuitting || !notifSettings().background) return;
    showTrayHintOnce();
  });
  win.on('session-end', () => { isQuitting = true; }); // arrêt / déconnexion de Windows
  win.on('closed', () => { mainWindow = null; });
  mainWindow = win;
  return win;
}

function showWindow() {
  if (!mainWindow) createWindow(false);
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  return mainWindow;
}

// ---------- Zone de notification (tray) ----------
function ensureTray() {
  if (tray) return;
  const img = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip('Mes Devoirs');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Ouvrir Mes Devoirs', click: showWindow },
    { type: 'separator' },
    { label: 'Quitter', click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.on('click', showWindow);
}

function destroyTray() {
  if (tray) { tray.destroy(); tray = null; }
}

// Applique les réglages qui touchent le système (icône dans la zone de notification, démarrage de Windows)
function applySystemSettings(settings) {
  const n = normalizeSettings(settings && settings.notifications);
  if (n.background) ensureTray(); else destroyTray();
  if (app.isPackaged) {
    try {
      app.setLoginItemSettings({ openAtLogin: n.startup, args: n.background ? ['--hidden'] : [] });
    } catch (e) { /* ignoré */ }
  }
}

// ---------- Notifications ----------
function notify({ title, body, filter }) {
  if (!Notification.isSupported()) return false;
  const n = new Notification({ title, body, icon: ICON_PATH });
  liveNotifications.add(n);
  const forget = () => liveNotifications.delete(n);
  n.on('click', () => {
    const existed = !!mainWindow;
    const win = showWindow();
    const send = () => win.webContents.send('notif:open', filter || 'todo');
    // Fenêtre toute neuve (recréée après une fermeture) : on attend que la page soit chargée
    if (!existed || win.webContents.isLoading()) win.webContents.once('did-finish-load', send); else send();
    forget();
  });
  n.on('close', forget);
  n.on('failed', forget);
  n.show();
  return true;
}

function showTrayHintOnce() {
  const st = readNotifState();
  if (st.trayHintShown) return;
  st.trayHintShown = true;
  writeNotifState(st);
  notify({
    title: 'Mes Devoirs reste actif',
    body: "L'application continue de t'envoyer tes rappels depuis la zone de notification. Clic droit sur son icône pour la quitter.",
  });
}

// Envoie le rappel quotidien si l'heure est passée et qu'il n'a pas encore été envoyé aujourd'hui
// (si l'appli était fermée à l'heure prévue, il part dès son ouverture).
function tick() {
  try {
    const data = readData();
    const s = normalizeSettings(data.settings.notifications);
    const state = readNotifState();
    const now = new Date();
    if (!isDue(s, state.lastSent, now)) return;
    state.lastSent = ymd(now);
    writeNotifState(state);
    const digest = buildDigest(data.homework, s, now);
    if (digest) notify(digest);
  } catch (e) { /* on réessaiera au prochain passage */ }
}

function startScheduler() {
  setTimeout(tick, 4000);
  setInterval(tick, 30 * 1000);
}

// ---------- IPC ----------
ipcMain.handle('data:load', () => readData());
ipcMain.handle('data:save', (_e, data) => {
  writeData(data);
  applySystemSettings(data && data.settings);
  return true;
});

ipcMain.handle('notif:test', () => {
  if (!Notification.isSupported()) return { ok: false };
  const data = readData();
  const digest = buildDigest(data.homework, data.settings.notifications);
  const ok = notify({
    title: 'Les notifications fonctionnent 🎉',
    body: digest ? `${digest.title}\n${digest.body}` : "Tu n'as aucun devoir à rendre bientôt.",
    filter: digest ? digest.filter : 'todo',
  });
  return { ok };
});

// ---------- Sauvegardes (fichiers de mémoire) : export / import ----------
const FILE_FILTERS = [
  { name: 'Sauvegarde Mes Devoirs (.json)', extensions: ['json'] },
  { name: 'Tous les fichiers', extensions: ['*'] },
];
let pendingImport = null; // fichier choisi, lu et nettoyé, en attente de la décision de l'utilisateur

ipcMain.handle('backup:export', async (e, data, parts) => {
  try {
    const win = BrowserWindow.fromWebContents(e.sender) || mainWindow;
    const r = await dialog.showSaveDialog(win, {
      title: 'Exporter une sauvegarde',
      defaultPath: path.join(app.getPath('documents'), backup.defaultFileName()),
      filters: FILE_FILTERS,
    });
    if (r.canceled || !r.filePath) return { ok: false, canceled: true };
    const file = backup.buildBackup(data, parts, app.getVersion());
    writeJson(r.filePath, file);
    return {
      ok: true,
      name: path.basename(r.filePath),
      dir: path.dirname(r.filePath),
      homework: file.homework ? file.homework.length : null,
      subjects: file.subjects ? file.subjects.length : null,
    };
  } catch (err) {
    return { ok: false, reason: 'write' };
  }
});

ipcMain.handle('backup:pick', async (e) => {
  pendingImport = null;
  try {
    const win = BrowserWindow.fromWebContents(e.sender) || mainWindow;
    const r = await dialog.showOpenDialog(win, {
      title: 'Importer une sauvegarde',
      properties: ['openFile'],
      filters: FILE_FILTERS,
    });
    if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };
    const file = r.filePaths[0];
    if (fs.statSync(file).size > backup.MAX_FILE_BYTES) return { ok: false, reason: 'size' };
    const parsed = backup.parseBackup(fs.readFileSync(file, 'utf8'));
    if (!parsed.ok) return parsed;
    pendingImport = parsed.data;
    return { ok: true, name: path.basename(file), counts: parsed.counts, exportedAt: parsed.exportedAt };
  } catch (err) {
    return { ok: false, reason: 'read' };
  }
});

ipcMain.handle('backup:apply', (_e, current, options) => {
  if (!pendingImport) return { ok: false, reason: 'none' };
  try {
    // Copie de secours de l'état actuel avant de toucher à quoi que ce soit
    try { writeJson(path.join(app.getPath('userData'), 'avant-import.json'), { saved: new Date().toISOString(), ...current }); } catch (err) { /* pas bloquant */ }
    const r = backup.applyImport(current, pendingImport, options);
    pendingImport = null;
    return { ok: true, state: r.state, report: r.report };
  } catch (err) {
    return { ok: false, reason: 'apply' };
  }
});

ipcMain.handle('backup:cancel', () => { pendingImport = null; return true; });

// ---------- Fichiers joints et liens ----------
// Types de fichiers qu'on refuse d'ouvrir depuis l'appli (un fichier de données importé pourrait y pointer)
const UNSAFE_EXT = new Set([
  '.exe', '.com', '.bat', '.cmd', '.msi', '.msp', '.scr', '.pif', '.cpl', '.dll', '.sys', '.lnk', '.url', '.reg', '.inf',
  '.ps1', '.psm1', '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.hta', '.jar', '.appx', '.msix', '.application', '.scf', '.gadget',
]);

ipcMain.handle('file:pick', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender) || undefined;
  const r = await dialog.showOpenDialog(win, { title: 'Joindre un fichier', properties: ['openFile', 'multiSelections'] });
  if (r.canceled) return [];
  return r.filePaths.slice(0, 10).map((p) => ({ path: p, name: path.basename(p) }));
});

ipcMain.handle('file:open', async (_e, filePath) => {
  if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) return { ok: false, reason: 'invalid' };
  if (UNSAFE_EXT.has(path.extname(filePath).toLowerCase())) return { ok: false, reason: 'unsafe' };
  let st;
  try { st = fs.statSync(filePath); } catch (err) { return { ok: false, reason: 'missing' }; }
  if (!st.isFile()) return { ok: false, reason: 'invalid' };
  const failure = await shell.openPath(filePath);
  return failure ? { ok: false, reason: 'error' } : { ok: true };
});

ipcMain.handle('link:open', (_e, url) => {
  try {
    const u = new URL(String(url));
    if (u.protocol === 'http:' || u.protocol === 'https:') { shell.openExternal(u.href); return true; }
  } catch (err) { /* lien invalide */ }
  return false;
});

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('update:check', async (_e, repo, tag) => {
  const r = await checkForUpdate(repo, app.getVersion(), tag);
  // L'adresse du fichier reste côté principal : l'interface ne peut pas choisir quoi télécharger
  lastAsset = r && r.asset ? r.asset : null;
  if (r && r.asset) r.asset = { name: r.asset.name, size: r.asset.size };
  return r;
});

// Télécharge l'installeur adapté à l'architecture de ce PC, puis l'ouvre et ferme l'appli
ipcMain.handle('update:download', async (e) => {
  if (!lastAsset || !ASSET_URL.test(lastAsset.url)) return { ok: false, reason: 'no-asset' };
  if (downloading) return { ok: false, reason: 'busy' };
  downloading = true;
  try {
    const dir = path.join(app.getPath('temp'), 'MesDevoirs-update');
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (err) { /* anciens fichiers : pas grave */ }
    const dest = path.join(dir, path.basename(lastAsset.name));

    let lastSent = 0;
    const r = await downloadFile({
      url: lastAsset.url,
      dest,
      expectedSize: lastAsset.size,
      sha256: lastAsset.sha256,
      onProgress: (p) => {
        const t = Date.now();
        if (t - lastSent < 100 && p.received !== p.total) return;
        lastSent = t;
        if (!e.sender.isDestroyed()) e.sender.send('update:progress', p);
      },
    });
    if (!r.ok) return r;

    const openError = await shell.openPath(dest); // ouvre l'installateur Windows (.msi)
    if (openError) return { ok: false, reason: 'launch' };

    // On ferme l'appli pour que l'installateur puisse remplacer ses fichiers
    setTimeout(() => { isQuitting = true; app.quit(); }, 2000);
    return { ok: true };
  } finally {
    downloading = false;
  }
});
ipcMain.handle('update:list', (_e, repo) => listReleases(repo));
ipcMain.handle('update:open', (_e, url) => {
  // On n'ouvre que des pages GitHub
  if (typeof url === 'string' && /^https:\/\/github\.com\//.test(url)) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

// ---------- Démarrage ----------
// Une seule instance à la fois
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.on('before-quit', () => { isQuitting = true; });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    const settings = readData().settings;
    // Lancé par Windows au démarrage : on reste discret dans la zone de notification
    const startHidden = process.argv.includes('--hidden') && normalizeSettings(settings.notifications).background;
    createWindow(startHidden);
    applySystemSettings(settings);
    startScheduler();
    app.on('activate', () => showWindow());
  });

  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') return;
    // En mode « arrière-plan », fermer la fenêtre ne quitte pas l'appli (elle reste dans la zone de notification)
    if (!isQuitting && notifSettings().background) return;
    app.quit();
  });
}
