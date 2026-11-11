const { app, BrowserWindow, ipcMain, Menu, shell, Notification, Tray, nativeImage, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { checkForUpdate, listReleases } = require('./updater');
const { downloadFile } = require('./downloader');
const {
  normalizeSettings, buildDigest, isDue, ymd, isPaused, isDueAt, buildMorning, buildReminder,
  dueTomorrow, actionUrl, parseActionUrl, buildToastXml, daysUntil,
} = require('./notifier');
const backup = require('./backup');
const sync = require('./sync');
const { parseSchedule } = require('./schedule-import');
const i18n = require('./src/i18n');

// Dépôt GitHub des mises à jour : fixe, l'interface ne peut pas le changer
const UPDATE_REPO = 'rc9b8hcntp-svg/mydevoirs';

// Langue de l'interface (aussi pour les notifications et les menus) : « fr » ou « en »
let uiLang = 'fr';
const T = (text) => i18n.tr(text, uiLang);

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
    const data = {
      homework: Array.isArray(parsed.homework) ? parsed.homework : [],
      trash: Array.isArray(parsed.trash) ? parsed.trash : [],
      archive: Array.isArray(parsed.archive) ? parsed.archive : [],
      settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {},
    };
    uiLang = data.settings.language === 'en' ? 'en' : 'fr';
    return data;
  } catch (e) {
    return { homework: [], trash: [], archive: [], settings: {} };
  }
}

function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function writeData(data) {
  writeJson(dataFile(), {
    homework: Array.isArray(data.homework) ? data.homework : [],
    trash: Array.isArray(data.trash) ? data.trash : [],
    archive: Array.isArray(data.archive) ? data.archive : [],
    settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
  });
  uiLang = data.settings && data.settings.language === 'en' ? 'en' : 'fr';
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
  refreshTrayMenu();
  tray.on('click', showWindow);
}

function refreshTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: T('Ouvrir Mes Devoirs'), click: showWindow },
    { label: T('Mini-widget'), click: () => toggleWidget() },
    { type: 'separator' },
    { label: T('Quitter'), click: () => { isQuitting = true; app.quit(); } },
  ]));
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
function notify({ title, body, filter, homeworkId }) {
  if (!Notification.isSupported()) return false;
  const s = notifSettings();
  title = T(title);
  body = T(body);
  const opts = { title, body, icon: ICON_PATH, silent: s.sound === 'silent' };
  if (process.platform === 'win32') {
    // 12 : boutons dans la notification (ils relancent l'appli en douce via mesdevoirs://…, sans ouvrir la fenêtre)
    // 15 : son au choix ou silence
    const actions = s.actions && homeworkId
      ? [
        { label: T('Marquer fait'), url: actionUrl('done', homeworkId) },
        { label: T('Rappeler demain'), url: actionUrl('snooze', homeworkId) },
      ]
      : [];
    opts.toastXml = buildToastXml({ title, body, sound: s.sound, actions });
  }
  const n = new Notification(opts);
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

// Envoie les rappels dont l'heure est passée et qui n'ont pas encore été envoyés aujourd'hui
// (si l'appli était fermée à l'heure prévue, ils partent dès son ouverture).
function tick() {
  try {
    const data = readData();
    const s = normalizeSettings(data.settings.notifications);
    const now = new Date();
    if (isPaused(s, now)) return; // 14. mode vacances : rien du tout
    const state = readNotifState();
    const today = ymd(now);
    const out = [];
    let changed = false;

    // Rappel quotidien (liste)
    if (isDue(s, state.lastSent, now)) {
      state.lastSent = today; changed = true;
      const digest = buildDigest(data.homework, s, now);
      if (digest) out.push(digest);
    }

    // 13. Rappel du matin (abandonné s'il est trop tard dans la journée)
    if (s.morning && isDueAt(s.morningTime, state.lastMorning, now)) {
      state.lastMorning = today; changed = true;
      if (isDueAt(s.morningTime, undefined, now, 240)) {
        const m = buildMorning(data.homework, s, now);
        if (m) out.push(m);
      }
    }

    // 11. Une notification par devoir, la veille de l'échéance
    if (s.dueReminder && isDueAt(s.dueTime, state.lastDue, now)) {
      state.lastDue = today; changed = true;
      const list = dueTomorrow(data.homework, now);
      list.slice(0, 5).forEach((h) => out.push(buildReminder(h, now)));
      if (list.length > 5) out.push({ title: `${list.length - 5} autres devoirs pour demain`, body: 'Ouvre la liste pour les voir.', filter: 'today' });
    }

    // Devoirs « rappelés demain » dont l'heure est venue
    const snoozed = state.snoozed && typeof state.snoozed === 'object' ? state.snoozed : {};
    Object.keys(snoozed).forEach((id) => {
      if (snoozed[id] > now.getTime()) return;
      delete snoozed[id]; changed = true;
      const h = data.homework.find((x) => x && x.id === id);
      if (h && !h.done) out.push(buildReminder(h, now));
    });
    state.snoozed = snoozed;

    if (changed) writeNotifState(state);
    out.forEach(notify);
  } catch (e) { /* on réessaiera au prochain passage */ }
}

// ---------- Synchronisation par dossier ----------
const syncState = { lastSync: 0, lastError: '', remoteMtime: 0 };
const syncFilePath = (settings) => {
  const f = settings && settings.syncFolder;
  return typeof f === 'string' && f ? path.join(f, sync.FILE_NAME) : null;
};
const syncView = (d) => ({
  homework: d.homework, trash: d.trash, archive: d.archive,
  subjects: (d.settings && d.settings.subjects) || [], templates: (d.settings && d.settings.templates) || [],
});

// Fusionne l'état local avec le fichier du dossier partagé (et l'écrit si besoin).
// Renvoie { data, changedLocal, ok, error }.
function runSync(data) {
  const file = syncFilePath(data.settings);
  if (!file) return { data, changedLocal: false, ok: false, disabled: true };
  try {
    let remote = { homework: [], trash: [], archive: [], subjects: [], templates: [] };
    let exists = false;
    if (fs.existsSync(file)) {
      const parsed = sync.parseSyncFile(fs.readFileSync(file, 'utf8'));
      if (!parsed.ok) { syncState.lastError = parsed.reason; return { data, changedLocal: false, ok: false, error: parsed.reason }; } // on n'écrase jamais un fichier qu'on ne comprend pas
      remote = parsed.data;
      exists = true;
    }
    const r = sync.mergeData(syncView(data), remote);
    let out = data;
    if (r.changedLocal) {
      out = Object.assign({}, data, {
        homework: r.merged.homework, trash: r.merged.trash, archive: r.merged.archive,
        settings: Object.assign({}, data.settings, { subjects: r.merged.subjects, templates: r.merged.templates }),
      });
    }
    if (r.changedRemote || !exists) writeJson(file, sync.buildSyncFile(syncView(out), os.hostname()));
    syncState.lastSync = Date.now();
    syncState.lastError = '';
    try { syncState.remoteMtime = fs.statSync(file).mtimeMs; } catch (e) { /* pas grave */ }
    return { data: out, changedLocal: r.changedLocal, ok: true };
  } catch (e) {
    syncState.lastError = 'access';
    return { data, changedLocal: false, ok: false, error: 'access' };
  }
}

// Ce que l'interface reçoit quand les données changent en dehors d'elle (synchro, notification, widget)
function pushToMain(data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('data:changed', {
      homework: data.homework, trash: data.trash, archive: data.archive,
      subjects: data.settings.subjects || null, templates: data.settings.templates || null,
    });
  }
}

// Enregistre un changement venu de l'extérieur de la fenêtre (bouton de notification, widget) puis met tout à jour
function commit(data) {
  writeData(data);
  const r = runSync(data);
  const final = r.changedLocal ? r.data : data;
  if (r.changedLocal) writeData(final);
  pushToMain(final);
  refreshWidget();
}

// Vérifie de temps en temps si l'autre ordinateur a modifié le fichier partagé
function syncPoll() {
  try {
    const d = readData();
    const file = syncFilePath(d.settings);
    if (!file) return;
    let m = 0;
    try { m = fs.statSync(file).mtimeMs; } catch (e) { return; }
    if (m === syncState.remoteMtime) return;
    const r = runSync(d);
    if (r.changedLocal) { writeData(r.data); pushToMain(r.data); refreshWidget(); }
  } catch (e) { /* réessaiera */ }
}

// 12. Actions des boutons de notification (mesdevoirs://done/ID ou mesdevoirs://snooze/ID)
function markDone(data, id, done) {
  const h = data.homework.find((x) => x && x.id === id);
  if (!h || !!h.done === done) return false;
  h.done = done;
  h.doneAt = done ? Date.now() : null;
  h.updatedAt = Date.now();
  if (done && h.repeat && h.date) h.pendingSpawn = true; // l'appli créera le prochain devoir à sa prochaine ouverture
  if (!done && h.spawned) {
    const n = data.homework.find((x) => x.id === h.spawned);
    if (n && !n.done) data.homework = data.homework.filter((x) => x !== n);
    delete h.spawned;
  }
  return true;
}

function handleAction({ action, id }) {
  try {
    const data = readData();
    if (action === 'done') {
      if (markDone(data, id, true)) commit(data);
    } else if (action === 'snooze') {
      const s = notifSettings();
      const when = new Date();
      const [hh, mm] = s.morningTime.split(':').map(Number);
      when.setDate(when.getDate() + 1);
      when.setHours(hh, mm, 0, 0);
      const state = readNotifState();
      state.snoozed = Object.assign({}, state.snoozed, { [id]: when.getTime() });
      writeNotifState(state);
    }
  } catch (e) { /* ignoré */ }
}

// ---------- Mini-widget (petite fenêtre toujours visible) ----------
let widgetWin = null;
const widgetStateFile = () => path.join(app.getPath('userData'), 'widget-state.json');
function readWidgetState() {
  try { const s = JSON.parse(fs.readFileSync(widgetStateFile(), 'utf8')); return s && typeof s === 'object' ? s : {}; } catch (e) { return {}; }
}
function writeWidgetState(patch) {
  try { writeJson(widgetStateFile(), Object.assign(readWidgetState(), patch)); } catch (e) { /* pas grave */ }
}

function widgetBoundsOk(b) {
  if (!b || ![b.x, b.y, b.width, b.height].every(Number.isFinite)) return false;
  return screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return b.x + 60 < a.x + a.width && b.x + b.width - 60 > a.x && b.y + 30 < a.y + a.height && b.y + 30 > a.y;
  });
}

function createWidget() {
  if (widgetWin) { widgetWin.show(); return widgetWin; }
  const st = readWidgetState();
  const b = widgetBoundsOk(st.bounds) ? st.bounds : null;
  const area = screen.getPrimaryDisplay().workArea;
  const size = { width: 300, height: 420 };
  const win = new BrowserWindow({
    width: b ? b.width : size.width,
    height: b ? b.height : size.height,
    x: b ? b.x : area.x + area.width - size.width - 24,
    y: b ? b.y : area.y + 24,
    minWidth: 230,
    minHeight: 160,
    frame: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: st.pinned !== false,
    show: false,
    title: 'Mes Devoirs · widget',
    backgroundColor: '#1a1d27',
    icon: ICON_PATH,
    webPreferences: { preload: path.join(__dirname, 'widget-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'widget.html'));
  win.once('ready-to-show', () => win.showInactive());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  let t = null;
  const saveBounds = () => { clearTimeout(t); t = setTimeout(() => { if (!win.isDestroyed()) writeWidgetState({ bounds: win.getBounds() }); }, 400); };
  win.on('moved', saveBounds);
  win.on('resized', saveBounds);
  win.on('closed', () => { clearTimeout(t); widgetWin = null; });
  widgetWin = win;
  return win;
}

function toggleWidget(force) {
  const want = typeof force === 'boolean' ? force : !widgetWin;
  if (want) createWidget(); else if (widgetWin) widgetWin.close();
  return !!widgetWin;
}

function refreshWidget() {
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('widget:refresh');
}

// Ce que le widget a le droit de voir. Avec un code de verrouillage, il n'affiche que des nombres.
function widgetPayload() {
  const d = readData();
  const s = d.settings;
  const now = new Date();
  const locked = !!(s.lock && s.lock.hash);
  const open = d.homework.filter((h) => h && !h.done && h.title);
  const days = (h) => (h.date ? daysUntil(h.date, now) : null);
  const base = {
    locked,
    language: uiLang,
    theme: s.theme || 'light',
    accent: s.accent || 'indigo',
    compact: !!s.compact,
    pinned: readWidgetState().pinned !== false,
    counts: {
      late: open.filter((h) => days(h) !== null && days(h) < 0).length,
      today: open.filter((h) => days(h) === 0).length,
      tomorrow: open.filter((h) => days(h) === 1).length,
    },
  };
  if (locked) return Object.assign(base, { items: [], subjects: [] });
  return Object.assign(base, {
    subjects: (s.subjects || []).map((x) => ({ name: x.name, color: x.color })),
    items: open.filter((h) => days(h) !== null && days(h) <= 1).slice(0, 60).map((h) => ({
      id: h.id, title: String(h.title).slice(0, 200), subject: h.subject || '', date: h.date, priority: h.priority || 1, kind: h.kind || '', minutes: h.minutes || 0,
      subtasks: (h.subtasks || []).length, subtasksDone: (h.subtasks || []).filter((x) => x.done).length,
    })),
  });
}

ipcMain.handle('widget:load', () => widgetPayload());
ipcMain.handle('widget:done', (_e, id, done) => {
  const data = readData();
  if (markDone(data, String(id), !!done)) commit(data);
  return true;
});
ipcMain.handle('widget:open', () => { showWindow(); return true; });
ipcMain.handle('widget:new', () => {
  const existed = !!mainWindow;
  const win = showWindow();
  const send = () => win.webContents.send('app:new');
  if (!existed || win.webContents.isLoading()) win.webContents.once('did-finish-load', send); else send();
  return true;
});
ipcMain.handle('widget:close', () => { if (widgetWin) widgetWin.close(); return true; });
ipcMain.handle('widget:pin', () => {
  if (!widgetWin) return true;
  const pinned = !widgetWin.isAlwaysOnTop();
  widgetWin.setAlwaysOnTop(pinned);
  writeWidgetState({ pinned });
  return pinned;
});
ipcMain.handle('widget:toggle', (_e, force) => toggleWidget(typeof force === 'boolean' ? force : undefined));
ipcMain.handle('widget:state', () => !!widgetWin);

const actionFromArgv = (argv) => (argv || []).map(parseActionUrl).find(Boolean) || null;

function startScheduler() {
  setTimeout(tick, 4000);
  setInterval(tick, 30 * 1000);
  setInterval(syncPoll, 30 * 1000);
}

// ---------- IPC ----------
ipcMain.handle('data:load', () => {
  let d = readData();
  const r = runSync(d); // si la synchro est active, on repart de la version fusionnée
  if (r.changedLocal) { d = r.data; writeData(d); }
  return d;
});
ipcMain.handle('data:save', (_e, data) => {
  const d = {
    homework: Array.isArray(data && data.homework) ? data.homework : [],
    trash: Array.isArray(data && data.trash) ? data.trash : [],
    archive: Array.isArray(data && data.archive) ? data.archive : [],
    settings: data && data.settings && typeof data.settings === 'object' ? data.settings : {},
  };
  writeData(d);
  applySystemSettings(d.settings);
  refreshTrayMenu();
  const r = runSync(d);
  if (r.changedLocal) { writeData(r.data); pushToMain(r.data); } // l'autre ordinateur avait du nouveau
  refreshWidget();
  return true;
});

// ----- Synchronisation : choix du dossier, état, synchroniser maintenant -----
ipcMain.handle('sync:pick', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender) || mainWindow;
  const r = await dialog.showOpenDialog(win, { title: T('Choisir le dossier de synchronisation'), properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };
  return { ok: true, folder: r.filePaths[0] };
});
ipcMain.handle('sync:now', () => {
  const d = readData();
  const r = runSync(d);
  if (r.changedLocal) { writeData(r.data); refreshWidget(); }
  return {
    ok: !!r.ok, disabled: !!r.disabled, error: r.error || '', lastSync: syncState.lastSync,
    data: r.changedLocal ? { homework: r.data.homework, trash: r.data.trash, archive: r.data.archive, subjects: r.data.settings.subjects || null, templates: r.data.settings.templates || null } : null,
  };
});
ipcMain.handle('sync:status', () => ({ lastSync: syncState.lastSync, error: syncState.lastError }));

// ----- Import d'un emploi du temps depuis un fichier -----
ipcMain.handle('schedule:import', async (e) => {
  try {
    const win = BrowserWindow.fromWebContents(e.sender) || mainWindow;
    const r = await dialog.showOpenDialog(win, {
      title: T('Importer un emploi du temps'),
      properties: ['openFile'],
      filters: [
        { name: T('Emploi du temps (.csv, .txt, .ics, .json)'), extensions: ['csv', 'txt', 'ics', 'json'] },
        { name: T('Tous les fichiers'), extensions: ['*'] },
      ],
    });
    if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };
    const file = r.filePaths[0];
    if (fs.statSync(file).size > 1024 * 1024) return { ok: false, reason: 'size' };
    const rows = parseSchedule(fs.readFileSync(file, 'utf8'), path.extname(file).slice(1));
    if (!rows.length) return { ok: false, reason: 'empty' };
    return { ok: true, name: path.basename(file), rows };
  } catch (err) {
    return { ok: false, reason: 'read' };
  }
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
      title: T('Exporter une sauvegarde'),
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
      title: T('Importer une sauvegarde'),
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

// ---------- Impression et PDF ----------
// La page se met en forme toute seule pour l'impression (feuille « #printSheet » dans la feuille de style)
ipcMain.handle('print:run', (e) => new Promise((resolve) => {
  try {
    e.sender.print({ printBackground: true }, (ok, reason) => resolve({ ok: !!ok, reason: String(reason || '') }));
  } catch (err) { resolve({ ok: false, reason: 'error' }); }
}));

ipcMain.handle('print:pdf', async (e, name) => {
  const win = BrowserWindow.fromWebContents(e.sender) || undefined;
  let base = String(name || 'MesDevoirs.pdf').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80);
  if (!/\.pdf$/i.test(base)) base += '.pdf';
  const r = await dialog.showSaveDialog(win, {
    title: T('Enregistrer en PDF'),
    defaultPath: path.join(app.getPath('documents'), base),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };
  try {
    const buf = await e.sender.printToPDF({ printBackground: true, pageSize: 'A4' });
    fs.writeFileSync(r.filePath, buf);
    return { ok: true, path: r.filePath };
  } catch (err) { return { ok: false }; }
});

// ---------- Fichiers joints et liens ----------
// Types de fichiers qu'on refuse d'ouvrir depuis l'appli (un fichier de données importé pourrait y pointer)
const UNSAFE_EXT = new Set([
  '.exe', '.com', '.bat', '.cmd', '.msi', '.msp', '.scr', '.pif', '.cpl', '.dll', '.sys', '.lnk', '.url', '.reg', '.inf',
  '.ps1', '.psm1', '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.hta', '.jar', '.appx', '.msix', '.application', '.scf', '.gadget',
]);

ipcMain.handle('file:pick', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender) || undefined;
  const r = await dialog.showOpenDialog(win, { title: T('Joindre un fichier'), properties: ['openFile', 'multiSelections'] });
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
ipcMain.handle('update:check', async (_e, _repo, tag) => {
  const r = await checkForUpdate(UPDATE_REPO, app.getVersion(), tag);
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
ipcMain.handle('update:list', () => listReleases(UPDATE_REPO));
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
  app.on('second-instance', (_e, argv) => {
    const a = actionFromArgv(argv);
    if (a) handleAction(a); else showWindow();
  });
  app.on('before-quit', () => { isQuitting = true; });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    const settings = readData().settings;
    // Lancé par Windows au démarrage : on reste discret dans la zone de notification
    const launchAction = actionFromArgv(process.argv);
    const bg = normalizeSettings(settings.notifications).background;
    const startHidden = (process.argv.includes('--hidden') || !!launchAction) && bg;
    // Lancé par un bouton de notification alors que l'appli était fermée : on fait l'action et on repart
    if (launchAction) {
      handleAction(launchAction);
      if (!bg) { isQuitting = true; app.quit(); return; }
    }
    if (app.isPackaged) { try { app.setAsDefaultProtocolClient('mesdevoirs'); } catch (e) { /* ignoré */ } }
    createWindow(startHidden);
    applySystemSettings(settings);
    if (settings.widgetAuto === true) createWidget();
    startScheduler();
    app.on('activate', () => showWindow());
  });

  app.on('window-all-closed', () => {
    if (process.platform === 'darwin') return;
    // En mode « arrière-plan », fermer la fenêtre ne quitte pas l'appli (elle reste dans la zone de notification)
    if (!isQuitting && notifSettings().background) return;
    if (!isQuitting && widgetWin) return; // le mini-widget reste ouvert
    app.quit();
  });
}
