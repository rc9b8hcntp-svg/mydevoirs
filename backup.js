'use strict';

// Fichiers de sauvegarde (« mémoire ») : export et import des devoirs, matières et réglages.
// Aucune dépendance à Electron, pour pouvoir tester ce module seul.

const { normalizeSettings } = require('./notifier');

const APP_ID = 'mes-devoirs';
const FORMAT = 1;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_HOMEWORK = 20000;
const MAX_SUBJECTS = 200;

const THEMES = ['light', 'dark', 'auto'];
const ACCENTS = ['indigo', 'violet', 'rose', 'rouge', 'orange', 'vert', 'turquoise', 'bleu'];
const SORTS = ['date', 'priority', 'subject', 'created'];
const FILTERS = ['todo', 'late', 'week', 'done', 'all'];
const COLOR = /^#[0-9a-f]{6}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const key = (s) => String(s || '').trim().toLowerCase();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ---------- Nettoyage (le fichier vient de l'extérieur : on ne lui fait pas confiance) ----------
function sanitizeHomework(list) {
  const out = [];
  const ids = new Set();
  (Array.isArray(list) ? list : []).slice(0, MAX_HOMEWORK).forEach((h) => {
    if (!h || typeof h !== 'object') return;
    const title = str(h.title, 500);
    if (!title) return;
    let id = str(h.id, 64);
    if (!id || ids.has(id)) id = uid();
    ids.add(id);
    const p = Number(h.priority);
    out.push({
      id,
      title,
      subject: str(h.subject, 60),
      date: typeof h.date === 'string' && DATE.test(h.date) ? h.date : '',
      notes: str(h.notes, 5000),
      priority: p === 2 || p === 3 ? p : 1,
      done: !!h.done,
      doneAt: h.done ? num(h.doneAt) : null,
      created: num(h.created) || Date.now(),
    });
  });
  return out;
}

function sanitizeSubjects(list) {
  const out = [];
  const seen = new Set();
  (Array.isArray(list) ? list : []).slice(0, MAX_SUBJECTS).forEach((s) => {
    if (!s || typeof s !== 'object') return;
    const name = str(s.name, 60).replace(/\s+/g, ' ');
    if (!name || seen.has(key(name))) return;
    seen.add(key(name));
    out.push({
      id: str(s.id, 64) || uid(),
      name,
      color: typeof s.color === 'string' && COLOR.test(s.color) ? s.color : '#8b93a7',
    });
  });
  return out;
}

// Réglages qu'on accepte d'importer. Volontairement absents : le dépôt de mises à jour et le tag de version
// (un fichier piégé pourrait sinon pointer vers un autre dépôt et faire installer un programme étranger).
function sanitizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  if (THEMES.includes(s.theme)) out.theme = s.theme;
  if (ACCENTS.includes(s.accent)) out.accent = s.accent;
  if (SORTS.includes(s.sort)) out.sort = s.sort;
  if (FILTERS.includes(s.startFilter)) out.startFilter = s.startFilter;
  if (['1', '2', '3'].includes(String(s.defaultPriority))) out.defaultPriority = String(s.defaultPriority);
  if (typeof s.confirmDelete === 'boolean') out.confirmDelete = s.confirmDelete;
  if (s.view === 'list' || s.view === 'calendar') out.view = s.view;
  if (s.calMode === 'month' || s.calMode === 'week') out.calMode = s.calMode;
  if (s.notifications && typeof s.notifications === 'object') out.notifications = normalizeSettings(s.notifications);
  return out;
}

// ---------- Export ----------
// parts : { homework, subjects, settings } (booleans)
function buildBackup(data, parts, appVersion, now = new Date()) {
  const p = Object.assign({ homework: true, subjects: true, settings: true }, parts);
  const settings = (data && data.settings) || {};
  const file = { app: APP_ID, format: FORMAT, exportedAt: now.toISOString(), appVersion: String(appVersion || '') };
  if (p.homework) file.homework = sanitizeHomework(data && data.homework);
  if (p.subjects) file.subjects = sanitizeSubjects(settings.subjects);
  if (p.settings) file.settings = sanitizeSettings(settings);
  return file;
}

function defaultFileName(now = new Date()) {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `MesDevoirs-sauvegarde-${d}.json`;
}

// ---------- Import ----------
// Lit le texte d'un fichier. Accepte aussi l'ancien fichier de données de l'appli (devoirs.json),
// où les matières sont rangées dans les réglages.
function parseBackup(text) {
  let raw;
  try { raw = JSON.parse(text); } catch (e) { return { ok: false, reason: 'json' }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, reason: 'format' };
  if (raw.app !== undefined && raw.app !== APP_ID) return { ok: false, reason: 'other-app' };
  if (raw.format !== undefined && (!Number.isInteger(raw.format) || raw.format > FORMAT)) return { ok: false, reason: 'too-new' };

  const hasHomework = Array.isArray(raw.homework);
  const rawSubjects = Array.isArray(raw.subjects) ? raw.subjects : (raw.settings && raw.settings.subjects);
  const hasSubjects = Array.isArray(rawSubjects);
  const hasSettings = !!raw.settings && typeof raw.settings === 'object' && !Array.isArray(raw.settings);
  if (!hasHomework && !hasSubjects && !hasSettings) return { ok: false, reason: 'empty' };

  const data = {
    homework: hasHomework ? sanitizeHomework(raw.homework) : null,
    subjects: hasSubjects ? sanitizeSubjects(rawSubjects) : null,
    settings: hasSettings ? sanitizeSettings(raw.settings) : null,
  };
  const exportedAt = typeof raw.exportedAt === 'string' && !Number.isNaN(Date.parse(raw.exportedAt)) ? raw.exportedAt : null;
  return {
    ok: true,
    data,
    exportedAt,
    counts: {
      homework: data.homework ? data.homework.length : null,
      subjects: data.subjects ? data.subjects.length : null,
      settings: data.settings ? Object.keys(data.settings).length : null,
    },
  };
}

function homeworkSignature(h) {
  return [key(h.title), key(h.subject), h.date || '', key(h.notes)].join('\u0001');
}

// current : { homework, settings } (état actuel de l'appli)
// data    : résultat de parseBackup().data
// options : { mode: 'merge' | 'replace', homework, subjects, settings } (ce qu'on importe)
// Renvoie le nouvel état + un compte rendu.
function applyImport(current, data, options) {
  const o = Object.assign({ mode: 'merge', homework: true, subjects: true, settings: true }, options);
  const replace = o.mode === 'replace';
  const cur = {
    homework: Array.isArray(current && current.homework) ? current.homework.slice() : [],
    settings: Object.assign({}, current && current.settings),
  };
  cur.settings.subjects = Array.isArray(cur.settings.subjects) ? cur.settings.subjects.slice() : [];
  const report = { homeworkAdded: 0, homeworkSkipped: 0, subjectsAdded: 0, settingsApplied: false, replaced: replace };

  if (o.homework && data.homework) {
    if (replace) {
      cur.homework = data.homework.slice();
      report.homeworkAdded = data.homework.length;
    } else {
      const ids = new Set(cur.homework.map((h) => h.id));
      const sigs = new Set(cur.homework.map(homeworkSignature));
      data.homework.forEach((h) => {
        const sig = homeworkSignature(h);
        // même contenu = déjà là (même s'il a un autre identifiant)
        if (sigs.has(sig)) { report.homeworkSkipped++; return; }
        // un devoir différent qui porte un identifiant déjà pris reçoit un nouvel identifiant (rien n'est écrasé)
        let id = h.id;
        while (ids.has(id)) id = uid();
        ids.add(id);
        sigs.add(sig);
        cur.homework.push(id === h.id ? h : Object.assign({}, h, { id }));
        report.homeworkAdded++;
      });
    }
  }

  if (o.subjects && data.subjects) {
    if (replace) {
      cur.settings.subjects = data.subjects.slice();
      report.subjectsAdded = data.subjects.length;
    } else {
      const names = new Set(cur.settings.subjects.map((s) => key(s.name)));
      data.subjects.forEach((s) => {
        if (names.has(key(s.name))) return;
        names.add(key(s.name));
        cur.settings.subjects.push(s);
        report.subjectsAdded++;
      });
    }
  }

  if (o.settings && data.settings) {
    const { notifications, ...rest } = data.settings;
    Object.assign(cur.settings, rest);
    if (notifications) cur.settings.notifications = notifications;
    report.settingsApplied = Object.keys(data.settings).length > 0;
  }

  return { state: cur, report };
}

module.exports = {
  APP_ID, FORMAT, MAX_FILE_BYTES,
  sanitizeHomework, sanitizeSubjects, sanitizeSettings,
  buildBackup, defaultFileName, parseBackup, applyImport,
};
