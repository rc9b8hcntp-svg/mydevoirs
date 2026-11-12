'use strict';

// Mes Devoirs « intégré » : l'interface de Mes Devoirs (dossier mes-devoirs/src) s'affiche dans la fenêtre de Cartable OS.
// Ce module est la moitié « programme principal » de cette intégration : il répond à l'interface de Mes Devoirs
// (canaux « dv:… », voir devoirs-embed-preload.js) à la place du main.js de Mes Devoirs, en réutilisant ses modules
// purs (sauvegardes, synchro, import d'emploi du temps) sans les modifier.
//
// Les données sont celles du logiciel Mes Devoirs à part (%APPDATA%\Mes Devoirs\devoirs.json) : les deux versions
// montrent donc exactement les mêmes devoirs. Quand l'une enregistre, l'autre recharge (surveillance du fichier).
//
// Pas d'import d'Electron ici : tout arrive par `deps`, ce qui permet de le tester sans Electron.

const fs = require('fs');
const path = require('path');
const os = require('os');
const backup = require('./mes-devoirs/backup');
const sync = require('./mes-devoirs/sync');
const { parseSchedule } = require('./mes-devoirs/schedule-import');
const i18n = require('./mes-devoirs/src/i18n');

const CHANNEL_PREFIX = 'dv:';
const WATCH_MS = 1500;
const MAX_SCHEDULE_BYTES = 1024 * 1024;

// Types de fichiers qu'on refuse d'ouvrir depuis l'appli (un fichier de données importé pourrait y pointer) : même liste que Mes Devoirs
const UNSAFE_EXT = new Set([
  '.exe', '.com', '.bat', '.cmd', '.msi', '.msp', '.scr', '.pif', '.cpl', '.dll', '.sys', '.lnk', '.url', '.reg', '.inf',
  '.ps1', '.psm1', '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.hta', '.jar', '.appx', '.msix', '.application', '.scf', '.gadget',
]);

const FILE_FILTERS = [
  { name: 'Sauvegarde Mes Devoirs (.json)', extensions: ['json'] },
  { name: 'Tous les fichiers', extensions: ['*'] },
];

// Ce que l'interface a le droit de nous envoyer à enregistrer
function cleanData(data) {
  return {
    homework: Array.isArray(data && data.homework) ? data.homework : [],
    trash: Array.isArray(data && data.trash) ? data.trash : [],
    archive: Array.isArray(data && data.archive) ? data.archive : [],
    settings: data && data.settings && typeof data.settings === 'object' ? data.settings : {},
  };
}

// Ce que l'interface reçoit quand les données changent en dehors d'elle
function changePayload(d) {
  return {
    homework: d.homework, trash: d.trash, archive: d.archive,
    subjects: (d.settings && d.settings.subjects) || null, templates: (d.settings && d.settings.templates) || null,
  };
}

/**
 * @param {object} deps
 *   ipcMain, dialog, shell, app           : Electron
 *   dataFile()                            : chemin de devoirs.json (partagé avec Mes Devoirs)
 *   isEmbedSender(event)                  : vrai seulement pour la vue de Mes Devoirs
 *   parentWindow()                        : fenêtre de Cartable OS (parent des boîtes de dialogue)
 *   sendToView(channel, payload)          : message vers l'interface de Mes Devoirs
 *   onSaved()                             : appelé après chaque enregistrement (pour rafraîchir l'accueil)
 *   updater                               : mises à jour (voir updates.js)
 */
function createEmbed(deps) {
  const { ipcMain, dialog, shell, app } = deps;
  let lang = 'fr';
  const T = (text) => i18n.tr(text, lang);
  let ownMtime = 0;        // date du fichier telle que NOUS l'avons écrit (pour ne pas nous recharger nous-mêmes)
  let watching = '';
  let pendingImport = null;
  const syncState = { lastSync: 0, lastError: '', remoteMtime: 0 };

  // ---------- Données ----------
  function readData() {
    try {
      const parsed = JSON.parse(fs.readFileSync(deps.dataFile(), 'utf8'));
      const data = cleanData(parsed);
      lang = data.settings.language === 'en' ? 'en' : 'fr';
      return data;
    } catch (e) {
      return cleanData(null);
    }
  }

  function writeJson(file, data) {
    const tmp = `${file}.tmp`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, file);
  }

  function writeData(data) {
    const d = cleanData(data);
    writeJson(deps.dataFile(), d);
    try { ownMtime = fs.statSync(deps.dataFile()).mtimeMs; } catch (e) { /* pas grave */ }
    lang = d.settings.language === 'en' ? 'en' : 'fr';
  }

  // ---------- Synchronisation par dossier (même logique que Mes Devoirs) ----------
  const syncFilePath = (settings) => {
    const f = settings && settings.syncFolder;
    return typeof f === 'string' && f ? path.join(f, sync.FILE_NAME) : null;
  };
  const syncView = (d) => ({
    homework: d.homework, trash: d.trash, archive: d.archive,
    subjects: (d.settings && d.settings.subjects) || [], templates: (d.settings && d.settings.templates) || [],
  });

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

  function syncPoll() {
    try {
      const d = readData();
      const file = syncFilePath(d.settings);
      if (!file) return;
      let m = 0;
      try { m = fs.statSync(file).mtimeMs; } catch (e) { return; }
      if (m === syncState.remoteMtime) return;
      const r = runSync(d);
      if (r.changedLocal) { writeData(r.data); deps.sendToView('data:changed', changePayload(r.data)); deps.onSaved(); }
    } catch (e) { /* réessaiera */ }
  }

  // ---------- Surveillance du fichier de données ----------
  // Mes Devoirs (le logiciel à part) ou la synchro modifient devoirs.json pendant que la vue est ouverte : on recharge l'interface.
  let syncTimer = null;
  function startWatch() {
    stopWatch();
    watching = deps.dataFile();
    try { ownMtime = fs.statSync(watching).mtimeMs; } catch (e) { ownMtime = 0; }
    fs.watchFile(watching, { interval: WATCH_MS, persistent: false }, (cur) => {
      if (!cur.mtimeMs || cur.mtimeMs === ownMtime) return;
      ownMtime = cur.mtimeMs;
      deps.sendToView('data:changed', changePayload(readData()));
      deps.onSaved();
    });
    syncTimer = setInterval(syncPoll, 30 * 1000);
    if (syncTimer.unref) syncTimer.unref();
  }

  function stopWatch() {
    if (watching) { try { fs.unwatchFile(watching); } catch (e) { /* déjà arrêté */ } watching = ''; }
    if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
  }

  // ---------- Réponses à l'interface ----------
  const on = (channel, fn) => ipcMain.handle(CHANNEL_PREFIX + channel, (e, ...args) => (deps.isEmbedSender(e) ? fn(e, ...args) : undefined));

  function register() {
    on('data:load', () => {
      let d = readData();
      const r = runSync(d); // si la synchro est active, on repart de la version fusionnée
      if (r.changedLocal) { d = r.data; writeData(d); }
      return d;
    });

    on('data:save', (_e, data) => {
      const d = cleanData(data);
      writeData(d);
      const r = runSync(d);
      if (r.changedLocal) { writeData(r.data); deps.sendToView('data:changed', changePayload(r.data)); } // l'autre ordinateur avait du nouveau
      deps.onSaved();
      return true;
    });

    on('app:version', () => app.getVersion());

    // ----- Synchronisation -----
    on('sync:pick', async () => {
      const r = await dialog.showOpenDialog(deps.parentWindow(), { title: T('Choisir le dossier de synchronisation'), properties: ['openDirectory', 'createDirectory'] });
      if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };
      return { ok: true, folder: r.filePaths[0] };
    });
    on('sync:now', () => {
      const d = readData();
      const r = runSync(d);
      if (r.changedLocal) writeData(r.data);
      return {
        ok: !!r.ok, disabled: !!r.disabled, error: r.error || '', lastSync: syncState.lastSync,
        data: r.changedLocal ? changePayload(r.data) : null,
      };
    });
    on('sync:status', () => ({ lastSync: syncState.lastSync, error: syncState.lastError }));

    // ----- Import d'un emploi du temps -----
    on('schedule:import', async () => {
      try {
        const r = await dialog.showOpenDialog(deps.parentWindow(), {
          title: T('Importer un emploi du temps'),
          properties: ['openFile'],
          filters: [
            { name: T('Emploi du temps (.csv, .txt, .ics, .json)'), extensions: ['csv', 'txt', 'ics', 'json'] },
            { name: T('Tous les fichiers'), extensions: ['*'] },
          ],
        });
        if (r.canceled || !r.filePaths[0]) return { ok: false, canceled: true };
        const file = r.filePaths[0];
        if (fs.statSync(file).size > MAX_SCHEDULE_BYTES) return { ok: false, reason: 'size' };
        const rows = parseSchedule(fs.readFileSync(file, 'utf8'), path.extname(file).slice(1));
        if (!rows.length) return { ok: false, reason: 'empty' };
        return { ok: true, name: path.basename(file), rows };
      } catch (err) {
        return { ok: false, reason: 'read' };
      }
    });

    // ----- Sauvegardes (fichiers de mémoire) -----
    on('backup:export', async (_e, data, parts) => {
      try {
        const r = await dialog.showSaveDialog(deps.parentWindow(), {
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

    on('backup:pick', async () => {
      pendingImport = null;
      try {
        const r = await dialog.showOpenDialog(deps.parentWindow(), { title: T('Importer une sauvegarde'), properties: ['openFile'], filters: FILE_FILTERS });
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

    on('backup:apply', (_e, current, options) => {
      if (!pendingImport) return { ok: false, reason: 'none' };
      try {
        // Copie de secours de l'état actuel avant de toucher à quoi que ce soit (au même endroit que Mes Devoirs)
        try { writeJson(path.join(path.dirname(deps.dataFile()), 'avant-import.json'), { saved: new Date().toISOString(), ...current }); } catch (err) { /* pas bloquant */ }
        const r = backup.applyImport(current, pendingImport, options);
        pendingImport = null;
        return { ok: true, state: r.state, report: r.report };
      } catch (err) {
        return { ok: false, reason: 'apply' };
      }
    });

    on('backup:cancel', () => { pendingImport = null; return true; });

    // ----- Mises à jour : celles de Cartable OS (un seul .msi pour les deux logiciels) -----
    on('update:check', (_e, _repo, tag) => deps.updater.check(tag)); // le dépôt est fixé par le build, l'interface ne le choisit pas
    on('update:list', () => deps.updater.list());
    on('update:download', (e) => deps.updater.download((p) => { if (!e.sender.isDestroyed()) e.sender.send('update:progress', p); }));
    on('update:open', (_e, url) => deps.updater.openPage(url));

    // ----- Impression et PDF (de la vue de Mes Devoirs seulement) -----
    on('print:run', (e) => new Promise((resolve) => {
      try {
        e.sender.print({ printBackground: true }, (ok, reason) => resolve({ ok: !!ok, reason: String(reason || '') }));
      } catch (err) { resolve({ ok: false, reason: 'error' }); }
    }));

    on('print:pdf', async (e, name) => {
      let base = String(name || 'MesDevoirs.pdf').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80);
      if (!/\.pdf$/i.test(base)) base += '.pdf';
      const r = await dialog.showSaveDialog(deps.parentWindow(), {
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

    // ----- Fichiers joints et liens -----
    on('file:pick', async () => {
      const r = await dialog.showOpenDialog(deps.parentWindow(), { title: T('Joindre un fichier'), properties: ['openFile', 'multiSelections'] });
      if (r.canceled) return [];
      return r.filePaths.slice(0, 10).map((p) => ({ path: p, name: path.basename(p) }));
    });

    on('file:open', async (_e, filePath) => {
      if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) return { ok: false, reason: 'invalid' };
      if (UNSAFE_EXT.has(path.extname(filePath).toLowerCase())) return { ok: false, reason: 'unsafe' };
      let st;
      try { st = fs.statSync(filePath); } catch (err) { return { ok: false, reason: 'missing' }; }
      if (!st.isFile()) return { ok: false, reason: 'invalid' };
      const failure = await shell.openPath(filePath);
      return failure ? { ok: false, reason: 'error' } : { ok: true };
    });

    on('link:open', (_e, url) => {
      try {
        const u = new URL(String(url));
        if (u.protocol === 'http:' || u.protocol === 'https:') { shell.openExternal(u.href); return true; }
      } catch (err) { /* lien invalide */ }
      return false;
    });
  }

  return { register, startWatch, stopWatch, readData, writeData, runSync, syncPoll };
}

// Ce que l'interface de Mes Devoirs ne peut pas faire une fois intégrée : elles appartiennent au logiciel à part
// (mini-widget, notifications Windows). On les masque dans l'interface intégrée. L'onglet « Mise à jour » reste :
// il met à jour Cartable OS et Mes Devoirs ensemble.
const HIDE_CSS = [
  '#widgetBtn',
  '.group:has(#w-open)',
  '.setting:has(#n-bg)',
  '.setting:has(#n-startup)',
  '.setting:has(#n-test)',
].join(',\n') + ' { display: none !important; }';

module.exports = { createEmbed, cleanData, changePayload, CHANNEL_PREFIX, UNSAFE_EXT, HIDE_CSS };
