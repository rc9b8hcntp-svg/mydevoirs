'use strict';

const { app, BrowserWindow, WebContentsView, ipcMain, Menu, Tray, nativeImage, dialog, shell, session, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { parseIcs, expand, subjectOf } = require('./ics');
const { computeStatus, watchWindow } = require('./scheduler');
const appsLib = require('./apps');
const devoirs = require('./devoirs-link');
const devoirsEmbed = require('./devoirs-embed');

app.setAppUserModelId('fr.maxence.cartableos');

const ICON_PATH = path.join(__dirname, 'build', 'icon.png');
const TICK_MS = 10 * 1000;
const MAX_ICS_BYTES = 5 * 1024 * 1024;
const DAY_MS = 86400000;

// ---------- Réglages ----------
const configFile = () => path.join(app.getPath('userData'), 'cartable.json');
const icsFile = () => path.join(app.getPath('userData'), 'emploi-du-temps.ics');

let config = {
  settings: { lockDuringSession: true, openAtLogin: true, rootFolder: '', subjectFolders: {}, apps: [] },
  state: { triggered: {}, shortcutsVersion: '' },
};

const bool = (v, d) => (typeof v === 'boolean' ? v : d);
const absDir = (v) => (typeof v === 'string' && path.isAbsolute(v) && v.length < 1000 ? v : '');

function loadConfig() {
  try {
    const raw = JSON.parse(fs.readFileSync(configFile(), 'utf8'));
    const s = raw.settings || {};
    const folders = {};
    if (s.subjectFolders && typeof s.subjectFolders === 'object') {
      Object.keys(s.subjectFolders).slice(0, 200).forEach((k) => { const d = absDir(s.subjectFolders[k]); if (d) folders[k] = d; });
    }
    const trig = {};
    const t = raw.state && raw.state.triggered && typeof raw.state.triggered === 'object' ? raw.state.triggered : {};
    Object.keys(t).slice(0, 500).forEach((k) => { if (Number.isFinite(t[k])) trig[k] = t[k]; });
    config = {
      settings: {
        lockDuringSession: bool(s.lockDuringSession, true),
        openAtLogin: bool(s.openAtLogin, true),
        rootFolder: absDir(s.rootFolder),
        subjectFolders: folders,
        apps: Array.isArray(s.apps) ? s.apps : [],
      },
      state: { triggered: trig, shortcutsVersion: raw.state && typeof raw.state.shortcutsVersion === 'string' ? raw.state.shortcutsVersion : '' },
    };
  } catch (e) { /* premier lancement : réglages par défaut */ }
}

function saveConfig() {
  try {
    const file = configFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(config, null, 2), 'utf8');
    fs.renameSync(tmp, file);
  } catch (e) { /* disque plein ou protégé : on garde les réglages en mémoire */ }
}

// ---------- Dossiers des matières ----------
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function safeFolderName(name) {
  let n = String(name || '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
  if (!n) n = 'Matière';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(n)) n = `_${n}`;
  return n.slice(0, 60);
}

const rootFolder = () => config.settings.rootFolder || path.join(app.getPath('documents'), 'Cartable OS');
const subjectFolder = (name) => config.settings.subjectFolders[norm(name)] || path.join(rootFolder(), safeFolderName(name));

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); return true; } catch (e) { return false; }
}

async function openFolder(dir) {
  if (!ensureDir(dir)) return false;
  return (await shell.openPath(dir)) === '';
}

// ---------- Emploi du temps ----------
let events = [];       // événements lus dans le fichier .ics
let occurrences = [];  // cours des prochains jours
let occDay = 0;
let status = computeStatus([], Date.now());

function loadSchedule() {
  try {
    events = parseIcs(fs.readFileSync(icsFile(), 'utf8'));
  } catch (e) { events = []; }
  occDay = 0;
}

function subjects() {
  const seen = new Map();
  events.forEach((e) => {
    const n = subjectOf(e.summary);
    if (n && !seen.has(norm(n))) seen.set(norm(n), n);
  });
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}

function refreshOccurrences(now) {
  const day = new Date(now).setHours(0, 0, 0, 0);
  if (day === occDay) return;
  const w = watchWindow(now);
  occurrences = expand(events, w.fromMs, w.toMs);
  occDay = day;
}

// ---------- Mes Devoirs ----------
let hwCache = { mtime: -1, list: null };
function homework() {
  const file = devoirs.dataFile(app.getPath('appData'));
  let mtime = 0;
  try { mtime = fs.statSync(file).mtimeMs; } catch (e) { mtime = -2; }
  if (mtime !== hwCache.mtime) hwCache = { mtime, list: devoirs.readHomework(file) };
  return hwCache.list;
}

const devoirsInstalled = () => (app.isPackaged ? fs.existsSync(devoirs.exePath(process.execPath)) : true);

async function openDevoirs() {
  if (!app.isPackaged) {
    // Pendant le développement (npm start) : on lance le dossier mes-devoirs avec Electron
    try {
      const c = spawn(process.execPath, [path.join(__dirname, 'mes-devoirs')], { detached: true, stdio: 'ignore' });
      c.on('error', () => {});
      c.unref();
      return { ok: true };
    } catch (e) { return { ok: false, reason: 'not-installed' }; }
  }
  const exe = devoirs.exePath(process.execPath);
  if (!fs.existsSync(exe)) return { ok: false, reason: 'not-installed' };
  const err = await shell.openPath(exe);
  return err ? { ok: false, reason: 'launch' } : { ok: true };
}

// L'installeur (.msi) copie Mes Devoirs à côté de Cartable OS ; ses raccourcis (menu Démarrer et Bureau) sont créés ici,
// juste après l'installation, avec le même identifiant Windows que Mes Devoirs pour que ses notifications fonctionnent.
function ensureDevoirsShortcuts() {
  if (process.platform !== 'win32' || !app.isPackaged) return;
  if (config.state.shortcutsVersion === app.getVersion()) return;
  const exe = devoirs.exePath(process.execPath);
  if (!fs.existsSync(exe)) return;
  const opts = { target: exe, cwd: path.dirname(exe), description: 'Mes Devoirs', icon: exe, iconIndex: 0, appUserModelId: devoirs.AUMID };
  try {
    const menu = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    ensureDir(menu);
    if (!shell.writeShortcutLink(path.join(menu, 'Mes Devoirs.lnk'), 'replace', opts)) return;
    shell.writeShortcutLink(path.join(app.getPath('desktop'), 'Mes Devoirs.lnk'), 'replace', opts);
    config.state.shortcutsVersion = app.getVersion();
    saveConfig();
  } catch (e) { /* on réessaiera au prochain lancement */ }
}

// ---------- Mes Devoirs intégré (dans la fenêtre de Cartable OS) ----------
// Le même logiciel que Mes Devoirs, mais son interface s'affiche directement sous la barre de Cartable OS, dans une vue
// de la fenêtre. Mêmes données que le logiciel à part (voir devoirs-embed.js).
const BAR_HEIGHT = 52; // hauteur de la barre du haut (.bar dans os.css) : la vue s'affiche en dessous
const DEVOIRS_UI = path.join(__dirname, 'mes-devoirs', 'src', 'index.html');
let dvView = null;
let dvShown = false;

const embedBridge = devoirsEmbed.createEmbed({
  ipcMain, dialog, shell, app,
  dataFile: () => devoirs.dataFile(app.getPath('appData')),
  isEmbedSender: (e) => !!dvView && !dvView.webContents.isDestroyed() && e.sender === dvView.webContents,
  parentWindow: () => (win && !win.isDestroyed() ? win : undefined),
  sendToView: (channel, payload) => { if (dvView && !dvView.webContents.isDestroyed()) dvView.webContents.send(channel, payload); },
  onSaved: () => { if (dvShown) pushState(false); },
});
embedBridge.register();

const devoirsEmbedAvailable = () => fs.existsSync(DEVOIRS_UI);

function layoutDevoirsView() {
  if (!dvView || !win || win.isDestroyed()) return;
  const [w, h] = win.getContentSize();
  dvView.setBounds({ x: 0, y: BAR_HEIGHT, width: Math.max(w, 0), height: Math.max(h - BAR_HEIGHT, 0) });
}

function ensureDevoirsView() {
  if (dvView && !dvView.webContents.isDestroyed()) return dvView;
  dvView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'devoirs-embed-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  if (dvView.setBackgroundColor) dvView.setBackgroundColor('#f5f6fa');
  const wc = dvView.webContents;
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  wc.on('will-navigate', (e) => e.preventDefault());
  // Ce qui appartient au logiciel à part (mini-widget, notifications Windows, mise à jour) est masqué dans la vue intégrée
  wc.on('dom-ready', () => { wc.insertCSS(devoirsEmbed.HIDE_CSS).catch(() => {}); });
  win.contentView.addChildView(dvView);
  wc.loadFile(DEVOIRS_UI);
  return dvView;
}

function openDevoirsEmbedded() {
  if (!devoirsEmbedAvailable()) return { ok: false, reason: 'missing' };
  if (!win || win.isDestroyed()) return { ok: false, reason: 'launch' };
  const first = !dvView;
  const view = ensureDevoirsView();
  view.setVisible(true);
  layoutDevoirsView();
  if (first || !dvShown) embedBridge.startWatch();
  dvShown = true;
  view.webContents.focus();
  pushState(true);
  return { ok: true };
}

// « Accueil » : on range la vue (sans la détruire, pour retrouver Mes Devoirs tel quel) et on arrête de surveiller le fichier
function closeDevoirsEmbedded() {
  if (!dvShown) return { ok: true };
  dvShown = false;
  embedBridge.stopWatch();
  if (dvView && !dvView.webContents.isDestroyed()) dvView.setVisible(false);
  if (win && !win.isDestroyed()) win.webContents.focus();
  pushState(true);
  return { ok: true };
}

function destroyDevoirsView() {
  embedBridge.stopWatch();
  dvShown = false;
  if (dvView) {
    try { if (win && !win.isDestroyed()) win.contentView.removeChildView(dvView); } catch (e) { /* déjà retirée */ }
    try { if (!dvView.webContents.isDestroyed()) dvView.webContents.close(); } catch (e) { /* déjà fermée */ }
    dvView = null;
  }
}

// ---------- Fenêtre ----------
let win = null;
let tray = null;
let quitting = false;
let sessionActive = false;
let showWhenReady = false;

const lockedNow = () => sessionActive && config.settings.lockDuringSession;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 620,
    frame: false,
    show: false,
    backgroundColor: '#0b0f1f',
    icon: ICON_PATH,
    title: 'Cartable OS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.once('ready-to-show', () => { if (showWhenReady) revealWindow(); });
  win.on('close', (e) => {
    if (quitting) return;
    e.preventDefault();
    // Pendant la session, Cartable OS ne se ferme pas ; sinon il se range dans la zone de notification
    if (!lockedNow()) { closeDevoirsEmbedded(); win.hide(); }
  });
  win.on('closed', () => { destroyDevoirsView(); win = null; });
  ['resize', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen'].forEach((ev) => win.on(ev, layoutDevoirsView));
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

function revealWindow() {
  if (!win || win.isDestroyed()) return;
  if (sessionActive) { if (!win.isFullScreen()) win.setFullScreen(true); } else {
    if (win.isFullScreen()) win.setFullScreen(false);
    if (!win.isMaximized()) win.maximize();
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  pushState(true);
}

function showMain() {
  if (!win || win.isDestroyed()) { showWhenReady = true; createWindow(); return; }
  showWhenReady = true;
  revealWindow();
}

function endSessionWindow() {
  if (!win || win.isDestroyed()) return;
  closeDevoirsEmbedded();
  if (win.isFullScreen()) win.setFullScreen(false);
  win.hide();
}

// ---------- Zone de notification ----------
let trayLocked = null;
function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: 'Ouvrir Cartable OS', click: () => showMain() },
    { label: 'Ouvrir Mes Devoirs (dans Cartable OS)', click: () => { showMain(); openDevoirsEmbedded(); } },
    { label: 'Ouvrir le logiciel Mes Devoirs', click: () => { openDevoirs(); } },
    { type: 'separator' },
    { label: 'Quitter', enabled: !lockedNow(), click: () => quitApp() },
  ]);
}

function createTray() {
  try {
    const img = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 });
    tray = new Tray(img);
    tray.setToolTip('Cartable OS');
    tray.on('click', () => showMain());
    tray.setContextMenu(buildTrayMenu());
    trayLocked = lockedNow();
  } catch (e) { tray = null; }
}

function quitApp() {
  if (lockedNow()) return false;
  quitting = true;
  app.quit();
  return true;
}

// ---------- Boucle principale : session et ouverture des dossiers ----------
let lastSent = '';

function publicOcc(o) {
  return o ? { summary: o.summary, subject: subjectOf(o.summary), location: o.location, startMs: o.startMs, endMs: o.endMs, key: o.key } : null;
}

function appsList() {
  const list = appsLib.normalizeApps(config.settings.apps);
  // Deux raccourcis pour Mes Devoirs : le logiciel à part (sa propre fenêtre) et la version intégrée (dans Cartable OS)
  list.splice(4, 0,
    { id: 'devoirs', kind: 'devoirs', name: 'Mes Devoirs', sub: 'Logiciel à part', note: 'Le logiciel Mes Devoirs, dans sa propre fenêtre', target: '', builtin: true, fixed: true },
    { id: 'devoirs-embed', kind: 'devoirs-embed', name: 'Mes Devoirs', sub: 'Dans Cartable OS', note: 'Mes Devoirs ouvert directement dans Cartable OS', target: '', builtin: true, fixed: true });
  return list;
}

function publicState(now) {
  const cur = status.current;
  return {
    now,
    platform: process.platform,
    version: app.getVersion(),
    locked: lockedNow(),
    settings: { lockDuringSession: config.settings.lockDuringSession, openAtLogin: config.settings.openAtLogin, rootFolder: rootFolder() },
    schedule: {
      loaded: events.length > 0,
      courseCount: events.length,
      subjects: subjects().map((n) => ({ name: n, folder: subjectFolder(n), custom: !!config.settings.subjectFolders[norm(n)] })),
      today: status.today.map(publicOcc),
      session: status.session,
      inSession: status.inSession,
      current: publicOcc(cur),
      next: publicOcc(status.next),
    },
    apps: appsList(),
    devoirs: {
      installed: devoirsInstalled(),
      embedAvailable: devoirsEmbedAvailable(),
      embedded: dvShown,
      summary: devoirs.summarize(homework(), new Date(now), cur ? subjectOf(cur.summary) : ''),
    },
  };
}

function pushState(force) {
  if (!win || win.isDestroyed() || win.webContents.isLoading()) return;
  const now = Date.now();
  const s = publicState(now);
  const text = JSON.stringify({ ...s, now: 0 });
  if (!force && text === lastSent) return;
  lastSent = text;
  win.webContents.send('state', s);
}

async function tick() {
  const now = Date.now();
  refreshOccurrences(now);
  status = computeStatus(occurrences, now);

  // Début / fin de la session (du premier au dernier cours du jour)
  if (status.inSession && !sessionActive) { sessionActive = true; showMain(); }
  else if (!status.inSession && sessionActive) { sessionActive = false; endSessionWindow(); }
  else if (sessionActive && (!win || win.isDestroyed())) showMain();

  // Début d'un cours : on ouvre le dossier de sa matière (une seule fois par cours)
  const cur = status.current;
  if (cur && config.state.triggered[cur.key] === undefined) {
    config.state.triggered[cur.key] = cur.startMs;
    Object.keys(config.state.triggered).forEach((k) => { if (config.state.triggered[k] < now - 2 * DAY_MS) delete config.state.triggered[k]; });
    saveConfig();
    const name = subjectOf(cur.summary);
    if (name) await openFolder(subjectFolder(name));
  }

  if (tray && trayLocked !== lockedNow()) { tray.setContextMenu(buildTrayMenu()); trayLocked = lockedNow(); }
  pushState(false);
}

// ---------- Échanges avec l'interface ----------
const fromUi = (e) => !!win && !win.isDestroyed() && e.sender === win.webContents;
const handle = (channel, fn) => ipcMain.handle(channel, (e, ...args) => (fromUi(e) ? fn(...args) : undefined));

handle('state:get', () => publicState(Date.now()));

handle('apps:launch', async (id) => {
  const a = appsList().find((x) => x.id === id);
  if (!a) return { ok: false, reason: 'invalid' };
  if (a.kind === 'devoirs') return openDevoirs();
  if (a.kind === 'devoirs-embed') return openDevoirsEmbedded();
  ensureDir(rootFolder());
  return appsLib.launchApp(a, { shell, spawn, platform: process.platform, rootFolder: rootFolder() });
});

handle('apps:add', (name, target) => {
  const n = appsLib.cleanName(name);
  const t = appsLib.cleanTarget(target);
  if (!n) return { ok: false, reason: 'name' };
  if (appsLib.classifyTarget(t) === 'invalid') return { ok: false, reason: 'target' };
  if (config.settings.apps.filter((a) => a && a.builtin !== true).length >= 40) return { ok: false, reason: 'full' };
  config.settings.apps.push({ id: appsLib.newId(), kind: 'custom', name: n, target: t, builtin: false });
  saveConfig();
  pushState(true);
  return { ok: true };
});

handle('apps:update', (id, name, target) => {
  const t = appsLib.cleanTarget(target);
  if (appsLib.classifyTarget(t) === 'invalid') return { ok: false, reason: 'target' };
  const cur = appsList().find((a) => a.id === id);
  if (!cur || cur.fixed) return { ok: false, reason: 'invalid' };
  const list = config.settings.apps;
  let entry = list.find((a) => a && a.id === id);
  if (!entry) { entry = { id, kind: cur.kind, builtin: true }; list.push(entry); }
  entry.target = t;
  if (!cur.builtin) {
    const n = appsLib.cleanName(name);
    if (!n) return { ok: false, reason: 'name' };
    entry.name = n;
  }
  saveConfig();
  pushState(true);
  return { ok: true };
});

handle('apps:remove', (id) => {
  const before = config.settings.apps.length;
  config.settings.apps = config.settings.apps.filter((a) => !(a && a.id === id && a.builtin !== true));
  if (config.settings.apps.length !== before) { saveConfig(); pushState(true); }
  return { ok: true };
});

handle('apps:pick', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Choisir un logiciel ou un fichier', properties: ['openFile'] });
  return r.canceled || !r.filePaths[0] ? '' : r.filePaths[0];
});

handle('schedule:import', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Choisir le fichier de l\'emploi du temps',
    properties: ['openFile'],
    filters: [{ name: 'Agenda (.ics)', extensions: ['ics'] }],
  });
  if (r.canceled || !r.filePaths[0]) return { ok: false, reason: 'canceled' };
  let text;
  try {
    if (fs.statSync(r.filePaths[0]).size > MAX_ICS_BYTES) return { ok: false, reason: 'big' };
    text = fs.readFileSync(r.filePaths[0], 'utf8');
  } catch (e) { return { ok: false, reason: 'read' }; }
  const parsed = parseIcs(text);
  if (!parsed.length) return { ok: false, reason: 'empty' };
  try {
    fs.mkdirSync(path.dirname(icsFile()), { recursive: true });
    fs.writeFileSync(icsFile(), text, 'utf8');
  } catch (e) { return { ok: false, reason: 'write' }; }
  events = parsed;
  occDay = 0;
  config.state.triggered = {};
  saveConfig();
  subjects().forEach((n) => ensureDir(subjectFolder(n)));
  await tick();
  pushState(true);
  return { ok: true, courses: events.length, subjects: subjects().length };
});

handle('schedule:clear', async () => {
  try { fs.rmSync(icsFile(), { force: true }); } catch (e) { /* déjà absent */ }
  events = [];
  occDay = 0;
  config.state.triggered = {};
  saveConfig();
  await tick();
  pushState(true);
  return { ok: true };
});

handle('settings:set', (key, value) => {
  if ((key !== 'lockDuringSession' && key !== 'openAtLogin') || typeof value !== 'boolean') return { ok: false };
  config.settings[key] = value;
  saveConfig();
  if (key === 'openAtLogin') applyLogin();
  tick();
  pushState(true);
  return { ok: true };
});

handle('folder:pickRoot', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Dossier principal de Cartable OS', defaultPath: rootFolder(), properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  config.settings.rootFolder = r.filePaths[0];
  saveConfig();
  subjects().forEach((n) => ensureDir(subjectFolder(n)));
  pushState(true);
  return { ok: true };
});

handle('folder:pickSubject', async (name) => {
  const n = subjects().find((s) => s === name);
  if (!n) return { ok: false };
  const r = await dialog.showOpenDialog(win, { title: `Dossier de ${n}`, defaultPath: subjectFolder(n), properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { ok: false };
  config.settings.subjectFolders[norm(n)] = r.filePaths[0];
  saveConfig();
  pushState(true);
  return { ok: true };
});

handle('folder:resetSubject', (name) => {
  delete config.settings.subjectFolders[norm(name)];
  saveConfig();
  pushState(true);
  return { ok: true };
});

handle('folder:open', async (name) => {
  const n = subjects().find((s) => s === name);
  if (!n) return { ok: false };
  return { ok: await openFolder(subjectFolder(n)) };
});

handle('devoirs:open', () => openDevoirs());
handle('devoirs:openEmbedded', () => openDevoirsEmbedded());
handle('devoirs:closeEmbedded', () => closeDevoirsEmbedded());
handle('win:minimize', () => { if (!lockedNow() && win) win.minimize(); });
handle('win:hide', () => { if (!lockedNow() && win) { closeDevoirsEmbedded(); win.hide(); } });
handle('app:quit', () => ({ ok: quitApp() }));

// ---------- Démarrage ----------
function applyLogin() {
  if (!app.isPackaged || process.platform !== 'win32') return;
  try { app.setLoginItemSettings({ openAtLogin: !!config.settings.openAtLogin, args: ['--hidden'] }); } catch (e) { /* ignoré */ }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showMain());
  app.on('before-quit', () => { quitting = true; });
  app.on('window-all-closed', () => { /* Cartable OS reste actif en arrière-plan pour suivre l'emploi du temps */ });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    loadConfig();
    loadSchedule();
    createTray();
    applyLogin();
    ensureDevoirsShortcuts();
    await tick();
    // Lancé à la main : on affiche l'écran d'accueil. Lancé par Windows (--hidden) : on attend le prochain cours.
    if (!process.argv.includes('--hidden') && !sessionActive) showMain();
    setInterval(() => { tick(); }, TICK_MS);
    powerMonitor.on('resume', () => { occDay = 0; tick(); });
  });
}
