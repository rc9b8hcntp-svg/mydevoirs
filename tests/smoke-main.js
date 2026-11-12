'use strict';
// Test « à blanc » du programme principal avec un faux Electron : node tests/smoke-main.js
process.env.TZ = 'Europe/Paris';
const Module = require('module');
const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cartable-smoke-'));
const log = { openPath: [], send: [], windows: [] };
const handlers = {};
let icsPath = '';
const appEvents = {};

class FakeWin {
  constructor(opts) {
    this.opts = opts; this.visible = false; this.fullscreen = false; this.maximized = false; this.destroyed = false; this.handlers = {}; this.onceH = {};
    this.webContents = { send: (c, p) => log.send.push([c, p]), setWindowOpenHandler() {}, on() {}, isLoading: () => false, focus() {} };
    this.contentView = { children: [], addChildView(v) { this.children.push(v); }, removeChildView(v) { this.children = this.children.filter((x) => x !== v); } };
    log.windows.push(this);
  }
  setMenuBarVisibility() {} loadFile() {} getContentSize() { return [1280, 820]; }
  once(e, f) { this.onceH[e] = f; setImmediate(() => { if (e === 'ready-to-show') f(); }); }
  on(e, f) { this.handlers[e] = f; }
  isDestroyed() { return this.destroyed; } isFullScreen() { return this.fullscreen; } setFullScreen(v) { this.fullscreen = v; }
  isMaximized() { return this.maximized; } maximize() { this.maximized = true; } isMinimized() { return false; } restore() {}
  show() { this.visible = true; } hide() { this.visible = false; } focus() {} minimize() {}
  emitClose() { let prevented = false; this.handlers.close({ preventDefault: () => { prevented = true; } }); return prevented; }
}

// Vue de Mes Devoirs intégré (WebContentsView)
const viewLog = { send: [], css: [], loaded: [], views: [] };
class FakeView {
  constructor(opts) {
    this.opts = opts; this.visible = true; this.bounds = null; this.destroyed = false;
    this.webContents = {
      send: (c, p) => viewLog.send.push([c, p]), setWindowOpenHandler() {}, on() {}, focus() {}, isDestroyed: () => this.destroyed,
      insertCSS: async (css) => { viewLog.css.push(css); }, loadFile: (f) => { viewLog.loaded.push(f); }, close: () => { this.destroyed = true; },
    };
    viewLog.views.push(this);
  }
  setBounds(b) { this.bounds = b; } setVisible(v) { this.visible = v; } setBackgroundColor() {}
}
let savePath = '';
let openPaths = [];

const electron = {
  app: {
    setAppUserModelId() {}, requestSingleInstanceLock: () => true, quit() { log.quit = true; },
    on(e, f) { appEvents[e] = f; }, whenReady: () => Promise.resolve(), isPackaged: false, getVersion: () => '1.0.0',
    getPath: (n) => { const p = path.join(tmp, n); fs.mkdirSync(p, { recursive: true }); return p; }, setLoginItemSettings() {},
  },
  BrowserWindow: FakeWin,
  WebContentsView: FakeView,
  ipcMain: { handle: (c, f) => { handlers[c] = f; } },
  Menu: { setApplicationMenu() {}, buildFromTemplate: (t) => t },
  Tray: class { setToolTip() {} on() {} setContextMenu() {} },
  nativeImage: { createFromPath: () => ({ resize: () => ({}) }) },
  dialog: {
    showOpenDialog: async () => ({ canceled: false, filePaths: openPaths.length ? openPaths : [icsPath] }),
    showSaveDialog: async () => ({ canceled: false, filePath: savePath }),
  },
  shell: { openPath: async (p) => { log.openPath.push(p); return ''; }, openExternal: async () => {}, writeShortcutLink: () => true },
  session: { defaultSession: { setPermissionRequestHandler() {} } },
  powerMonitor: { on() {} },
};
const orig = Module._load;
Module._load = function (request, ...rest) { return request === 'electron' ? electron : orig.call(this, request, ...rest); };

process.argv.push('--hidden');
require('../main.js');

const pad = (n) => String(n).padStart(2, '0');
const z = (ms) => { const d = new Date(ms); return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await sleep(100);
  assert.strictEqual(log.windows.length, 0, 'démarré en arrière-plan (--hidden), hors cours : pas de fenêtre');

  // Un cours de Maths qui a commencé il y a 5 minutes, et un autre dans 2 h
  const now = Date.now();
  icsPath = path.join(tmp, 'edt.ics');
  fs.writeFileSync(icsPath, `BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:1\r\nSUMMARY:Maths\r\nDTSTART:${z(now - 5 * 60000)}\r\nDTEND:${z(now + 55 * 60000)}\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:2\r\nSUMMARY:Français\r\nDTSTART:${z(now + 120 * 60000)}\r\nDTEND:${z(now + 180 * 60000)}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`);

  const sender = (() => { const w = log.windows[0]; return w ? w.webContents : null; })();
  // Il faut une fenêtre pour accepter les messages de l'interface : on l'ouvre comme le ferait le tray
  appEvents['second-instance']();
  await sleep(50);
  const win = log.windows[0];
  assert.ok(win && win.visible, 'second-instance ouvre la fenêtre');
  const e = { sender: win.webContents };

  const st0 = await handlers['state:get'](e);
  assert.strictEqual(st0.schedule.loaded, false);
  assert.deepStrictEqual(st0.apps.map((a) => a.id), ['word', 'excel', 'powerpoint', 'explorer', 'devoirs', 'devoirs-embed'], 'deux raccourcis Mes Devoirs');
  assert.strictEqual(st0.apps.find((a) => a.id === 'devoirs').sub, 'Logiciel à part');
  assert.strictEqual(st0.apps.find((a) => a.id === 'devoirs-embed').sub, 'Dans Cartable OS');
  assert.strictEqual(st0.devoirs.embedAvailable, true);
  assert.strictEqual(st0.devoirs.embedded, false);

  const imp = await handlers['schedule:import'](e);
  assert.deepStrictEqual(imp, { ok: true, courses: 2, subjects: 2 });
  assert.ok(win.fullscreen, 'la session a commencé : plein écran');
  const mathsDir = log.openPath.find((p) => /Maths$/.test(p));
  assert.ok(mathsDir, `le dossier Maths s'est ouvert (${log.openPath.join(' | ')})`);
  assert.ok(fs.existsSync(mathsDir), 'le dossier Maths a été créé');
  assert.ok(fs.existsSync(path.join(path.dirname(mathsDir), 'Français')), 'tous les dossiers de matières sont créés');
  const opened = log.openPath.length;

  await handlers['state:get'](e);
  const st = await handlers['state:get'](e);
  assert.strictEqual(st.locked, true);
  assert.strictEqual(st.schedule.current.subject, 'Maths');
  assert.strictEqual(st.schedule.next.subject, 'Français');
  assert.strictEqual(win.emitClose(), true);
  assert.strictEqual(win.visible, true, 'fermeture impossible pendant la session');
  assert.deepStrictEqual(await handlers['app:quit'](e), { ok: false });
  await handlers['win:hide'](e);
  assert.strictEqual(win.visible, true, 'ranger est aussi refusé pendant la session');

  // Interface : on ne répond qu'à la fenêtre de Cartable OS
  assert.strictEqual(await handlers['state:get']({ sender: {} }), undefined);

  // Désactiver le verrouillage : on peut fermer (la fenêtre se range)
  await handlers['settings:set'](e, 'lockDuringSession', false);
  assert.strictEqual(win.emitClose(), true);
  assert.strictEqual(win.visible, false, 'fermeture = rangement dans la zone de notification');
  assert.strictEqual(log.openPath.length, opened, 'le dossier d\'un cours ne s\'ouvre qu\'une fois');

  // Applications personnalisées
  assert.deepStrictEqual(await handlers['apps:add'](e, 'Mon ENT', 'https://ent.example.fr'), { ok: true });
  assert.deepStrictEqual(await handlers['apps:add'](e, 'Piège', 'calc & del'), { ok: false, reason: 'target' });
  const st2 = await handlers['state:get'](e);
  assert.strictEqual(st2.apps.length, 7);
  assert.deepStrictEqual(await handlers['apps:update'](e, 'word', 'x', 'C:\\Office\\WINWORD.EXE'), { ok: true });
  assert.strictEqual((await handlers['state:get'](e)).apps[0].target, 'C:\\Office\\WINWORD.EXE');
  assert.deepStrictEqual(await handlers['apps:launch'](e, 'nimporte-quoi'), { ok: false, reason: 'invalid' });

  // ---------- Mes Devoirs intégré ----------
  const dataPath = path.join(tmp, 'appData', 'Mes Devoirs', 'devoirs.json'); // le même fichier que le logiciel Mes Devoirs à part
  win.show();
  assert.deepStrictEqual(await handlers['apps:launch'](e, 'devoirs'), { ok: true }, 'le raccourci « logiciel à part » marche toujours');
  assert.strictEqual(viewLog.views.length, 0, 'le raccourci « logiciel à part » n\'ouvre pas la vue intégrée');
  assert.deepStrictEqual(await handlers['apps:launch'](e, 'devoirs-embed'), { ok: true });
  const view = viewLog.views[0];
  assert.ok(view && view.visible, 'la vue de Mes Devoirs est affichée');
  assert.deepStrictEqual(view.bounds, { x: 0, y: 52, width: 1280, height: 768 }, 'sous la barre de Cartable OS');
  assert.ok(win.contentView.children.includes(view), 'la vue est dans la fenêtre de Cartable OS');
  assert.ok(/mes-devoirs[\\/]src[\\/]index\.html$/.test(viewLog.loaded[0]), 'elle charge l\'interface de Mes Devoirs');
  const wp = view.opts.webPreferences;
  assert.ok(wp.sandbox && wp.contextIsolation && !wp.nodeIntegration && /devoirs-embed-preload\.js$/.test(wp.preload), 'vue isolée, preload dédié');
  assert.strictEqual((await handlers['state:get'](e)).devoirs.embedded, true);
  win.handlers.resize(); // la fenêtre change de taille : la vue suit
  assert.deepStrictEqual(view.bounds, { x: 0, y: 52, width: 1280, height: 768 });

  const ve = { sender: view.webContents };
  assert.strictEqual(await handlers['dv:data:load']({ sender: win.webContents }), undefined, 'seule la vue de Mes Devoirs a accès aux données');
  assert.deepStrictEqual((await handlers['dv:data:load'](ve)).homework, []);
  const t = new Date();
  const today = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  const hw = { id: 'h1', title: 'Exercices 3', subject: 'Maths', date: today, done: false, priority: 2, updatedAt: Date.now() };
  assert.strictEqual(await handlers['dv:data:save'](ve, { homework: [hw], trash: [], archive: [], settings: { theme: 'dark' } }), true);
  const onDisk = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  assert.strictEqual(onDisk.homework[0].title, 'Exercices 3');
  assert.strictEqual(onDisk.settings.theme, 'dark');
  const stE = await handlers['state:get'](e);
  assert.strictEqual(stE.devoirs.summary.today.length, 1, 'l\'accueil de Cartable OS voit les devoirs notés dans la vue intégrée');
  assert.strictEqual(stE.devoirs.summary.forCourse.length, 1, 'et celui du cours en cours (Maths)');

  // Sauvegardes : export puis import depuis la vue intégrée
  savePath = path.join(tmp, 'sauvegarde.json');
  const ex = await handlers['dv:backup:export'](ve, { homework: [hw], archive: [], settings: { subjects: [] } }, { homework: true, subjects: true, settings: false });
  assert.strictEqual(ex.ok, true);
  assert.strictEqual(ex.homework, 1);
  openPaths = [savePath];
  const pick = await handlers['dv:backup:pick'](ve);
  assert.strictEqual(pick.ok, true);
  const apply = await handlers['dv:backup:apply'](ve, { homework: [], archive: [], settings: {} }, { mode: 'merge' });
  assert.strictEqual(apply.ok, true);
  assert.strictEqual(apply.state.homework.length, 1);
  assert.deepStrictEqual(await handlers['dv:backup:apply'](ve, { homework: [] }, {}), { ok: false, reason: 'none' }, 'une sauvegarde ne s\'applique qu\'une fois');
  openPaths = [];

  // Fichiers et liens : mêmes protections que Mes Devoirs
  assert.deepStrictEqual(await handlers['dv:file:open'](ve, path.join(tmp, 'virus.exe')), { ok: false, reason: 'unsafe' });
  assert.deepStrictEqual(await handlers['dv:file:open'](ve, 'relatif.txt'), { ok: false, reason: 'invalid' });
  assert.strictEqual(await handlers['dv:link:open'](ve, 'javascript:alert(1)'), false);
  assert.strictEqual(await handlers['dv:link:open'](ve, 'https://example.fr'), true);

  // Un changement fait par le logiciel à part est repris par la vue ; le sien ne la recharge pas
  await sleep(2200);
  assert.strictEqual(viewLog.send.filter(([c]) => c === 'data:changed').length, 0, 'notre propre enregistrement ne recharge pas la vue');
  const ext = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  ext.homework.push({ id: 'h2', title: 'Lire le chapitre 4', subject: 'Français', date: '', done: false, priority: 1, updatedAt: Date.now() });
  fs.writeFileSync(dataPath, JSON.stringify(ext));
  const later = new Date(Date.now() + 5000);
  fs.utimesSync(dataPath, later, later);
  await sleep(2200);
  const changed = viewLog.send.filter(([c]) => c === 'data:changed');
  assert.strictEqual(changed.length, 1, 'la vue est prévenue quand le logiciel à part modifie les devoirs');
  assert.strictEqual(changed[0][1].homework.length, 2);

  // « Accueil » range la vue ; ranger la fenêtre aussi
  assert.deepStrictEqual(await handlers['devoirs:closeEmbedded'](e), { ok: true });
  assert.strictEqual(view.visible, false);
  assert.strictEqual((await handlers['state:get'](e)).devoirs.embedded, false);
  await handlers['devoirs:openEmbedded'](e);
  assert.strictEqual(viewLog.views.length, 1, 'rouvrir réutilise la même vue (on retrouve Mes Devoirs tel quel)');
  assert.ok(view.visible);
  await handlers['win:hide'](e);
  assert.strictEqual(view.visible, false, 'la fenêtre rangée → retour à l\'accueil');
  assert.strictEqual((await handlers['state:get']({ sender: win.webContents })).devoirs.embedded, false);

  // Réglages sauvegardés
  const saved = JSON.parse(fs.readFileSync(path.join(tmp, 'userData', 'cartable.json'), 'utf8'));
  assert.strictEqual(saved.settings.lockDuringSession, false);
  assert.strictEqual(saved.settings.apps.length, 2);

  await handlers['schedule:clear'](e);
  assert.strictEqual((await handlers['state:get'](e)).schedule.loaded, false);
  console.log('smoke-main : tout est bon');
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
})().catch((err) => { console.error(err); process.exit(1); });
