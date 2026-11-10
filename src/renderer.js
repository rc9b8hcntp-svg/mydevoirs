'use strict';

// ---------- Constantes ----------
const PRIORITY_LABELS = { 1: 'Normale', 2: 'Importante', 3: 'Urgente' };
const KINDS = { controle: { label: 'Contrôle', emoji: '📝' }, expose: { label: 'Exposé', emoji: '🎤' } }; // vide = simple devoir
const REPEATS = { daily: 'Chaque jour', weekly: 'Chaque semaine', monthly: 'Chaque mois' };
const FILTER_LABELS = { today: "Aujourd'hui et demain", todo: 'À faire', late: 'En retard', week: 'Cette semaine', done: 'Terminés', all: 'Tous les devoirs' };
const NEUTRAL = '#8b93a7';
const DEFAULT_UPDATE_REPO = 'rc9b8hcntp-svg/mydevoirs';
const NOTIF_DEFAULTS = {
  enabled: true, time: '18:00', daysAhead: 1, includeLate: true, background: true, startup: false,
  dueReminder: false, dueTime: '18:00', actions: true, morning: false, morningTime: '07:30',
  vacation: false, vacationFrom: '', vacationTo: '', sound: 'default',
};

// Anciennes couleurs automatiques (utilisées pour garder les couleurs des matières déjà créées)
const LEGACY_PALETTE = ['#4f6bed', '#e5484d', '#22a06b', '#f59e0b', '#a855f7', '#0ea5e9', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

// Couleurs proposées pour les matières
const SUBJECT_COLORS = [
  { name: 'Indigo', value: '#4f6bed' },
  { name: 'Bleu ciel', value: '#0ea5e9' },
  { name: 'Turquoise', value: '#14b8a6' },
  { name: 'Vert', value: '#22a06b' },
  { name: 'Citron vert', value: '#84cc16' },
  { name: 'Jaune', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rouge', value: '#e5484d' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Violet', value: '#a855f7' },
  { name: 'Ardoise', value: '#64748b' },
  { name: 'Marron', value: '#a16207' },
];

// Matières prédéfinies
const DEFAULT_SUBJECTS = [
  { name: 'Maths', color: '#4f6bed' },
  { name: 'Français', color: '#e5484d' },
  { name: 'Histoire-Géo', color: '#f59e0b' },
  { name: 'Anglais', color: '#a855f7' },
  { name: 'Espagnol', color: '#f97316' },
  { name: 'SVT', color: '#22a06b' },
  { name: 'Physique-Chimie', color: '#0ea5e9' },
  { name: 'Technologie', color: '#14b8a6' },
  { name: 'EPS', color: '#84cc16' },
  { name: 'Arts plastiques', color: '#ec4899' },
  { name: 'Musique', color: '#64748b' },
];

// Couleurs principales de l'application
const ACCENTS = [
  { id: 'indigo', name: 'Indigo', light: '#4f6bed', dark: '#7b8cff' },
  { id: 'violet', name: 'Violet', light: '#8b5cf6', dark: '#a78bfa' },
  { id: 'rose', name: 'Rose', light: '#ec4899', dark: '#f472b6' },
  { id: 'rouge', name: 'Rouge', light: '#e5484d', dark: '#f2777b' },
  { id: 'orange', name: 'Orange', light: '#ea6a0a', dark: '#fb923c' },
  { id: 'vert', name: 'Vert', light: '#22a06b', dark: '#3ccf91' },
  { id: 'turquoise', name: 'Turquoise', light: '#0d9488', dark: '#2dd4bf' },
  { id: 'bleu', name: 'Bleu', light: '#0284c7', dark: '#38bdf8' },
];

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.5-.7-.5-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-4.9-4.5-8-10-8z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  sliders: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  chart: '<path d="M3 3v18h18"/><path d="M8 16v-4M13 16V8M18 16v-7"/>',
  printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  paperclip: '<path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6a4 4 0 1 1 5.7 5.7l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

const state = {
  homework: [],
  settings: {},
  filter: 'todo',
  subject: null, // null = toutes les matières
  search: '',
  sort: 'date',
  editingId: null,
  view: 'list',
  calMode: 'month', // 'month' ou 'week'
  calAnchor: new Date(), // un jour de la période affichée
};

const $ = (id) => document.getElementById(id);

// ---------- Utilitaires ----------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysUntil(str) {
  const target = parseDate(str);
  if (!target) return null;
  const now = parseDate(todayStr());
  return Math.round((target - now) / 86400000);
}

function formatDate(str) {
  const d = parseDate(str);
  if (!d) return '';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function dueLabel(str) {
  const n = daysUntil(str);
  if (n === null) return null;
  if (n < -1) return { text: `En retard de ${-n} jours`, cls: 'late' };
  if (n === -1) return { text: 'En retard (hier)', cls: 'late' };
  if (n === 0) return { text: "Aujourd'hui", cls: 'soon' };
  if (n === 1) return { text: 'Demain', cls: 'soon' };
  return { text: formatDate(str), cls: '' };
}

function isLate(h) {
  return !h.done && h.date && daysUntil(h.date) < 0;
}

function isThisWeek(h) {
  if (h.done || !h.date) return false;
  const n = daysUntil(h.date);
  return n >= 0 && n <= 7;
}

function shiftDate(str, n) {
  const d = parseDate(str);
  return ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}
function isoDow(str) { // 1 = lundi … 7 = dimanche
  return (parseDate(str).getDay() + 6) % 7 + 1;
}
const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
function fmtNum(n) {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}
// Matières qui ont cours ce jour-là (emploi du temps)
function classesOn(date) {
  const d = isoDow(date);
  return state.settings.subjects.filter((s) => (s.days || []).includes(d)).map((s) => s.name);
}
function isTodayOrTomorrow(h) {
  if (h.done || !h.date) return false;
  const n = daysUntil(h.date);
  return n >= 0 && n <= 1;
}

function fmtMinutes(m) {
  m = Math.round(m);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
}

// Prochaine date d'un devoir qui se répète (toujours aujourd'hui ou plus tard)
function nextOccurrence(h) {
  const step = (str) => {
    const d = parseDate(str);
    if (h.repeat === 'daily') return ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
    if (h.repeat === 'weekly') return ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 2, 0).getDate(); // dernier jour du mois suivant
    return ymd(new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), lastDay)));
  };
  let next = step(h.date);
  const today = todayStr();
  for (let i = 0; next < today && i < 1000; i++) next = step(next);
  return next;
}

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(className, label) {
  const b = el('button', className, label);
  b.type = 'button';
  return b;
}

// ---------- Icônes ----------
function svg(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}
function setIcon(span, name) {
  span.dataset.icon = name;
  span.innerHTML = svg(name);
}
function mkIcon(name) {
  const s = el('span', 'ico');
  setIcon(s, name);
  return s;
}
function hydrateIcons() {
  document.querySelectorAll('.ico[data-icon]').forEach((s) => setIcon(s, s.dataset.icon));
}

// ---------- Sauvegarde ----------
let saveTimer = null;
function saveNow() {
  saveTimer = null;
  window.devoirsAPI.save({ homework: state.homework, settings: state.settings });
}
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 150);
}
// La fenêtre peut être vraiment fermée (puis recréée) : on n'oublie pas une sauvegarde en attente
window.addEventListener('beforeunload', () => {
  if (saveTimer) { clearTimeout(saveTimer); saveNow(); }
});

// ---------- Messages et « Annuler » ----------
let toastTimer = null;
function showToast(text, actionLabel, action) {
  const t = $('toast');
  $('toast-text').textContent = text;
  const b = $('toast-btn');
  b.hidden = !actionLabel;
  b.textContent = actionLabel || '';
  b.onclick = actionLabel ? () => { hideToast(); action(); } : null;
  try { if (t.matches(':popover-open')) t.hidePopover(); t.showPopover(); } catch (e) { /* popover indisponible */ }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, actionLabel ? 8000 : 4500);
}
function hideToast() {
  clearTimeout(toastTimer);
  try { $('toast').hidePopover(); } catch (e) { /* déjà fermé */ }
}

const undoStack = [];
function pushUndo(text, fn) {
  const entry = { fn };
  undoStack.push(entry);
  if (undoStack.length > 30) undoStack.shift();
  showToast(text, 'Annuler', () => runUndo(entry));
}
function runUndo(entry) {
  const i = undoStack.indexOf(entry);
  if (i === -1) return false;
  undoStack.splice(i, 1);
  entry.fn();
  persist();
  render();
  return true;
}
function undoLast() {
  const entry = undoStack[undoStack.length - 1];
  if (!entry) return false;
  hideToast();
  return runUndo(entry);
}

function deleteItems(items, text) {
  const ids = new Set(items.map((h) => h.id));
  state.homework = state.homework.filter((h) => !ids.has(h.id));
  persist();
  render();
  pushUndo(text, () => { state.homework.push(...items); });
}

// ---------- Terminé / pas terminé (avec les devoirs qui se répètent) ----------
function cloneForRepeat(h, date) {
  return {
    id: uid(), title: h.title, subject: h.subject || '', date, notes: h.notes || '', priority: h.priority || 1,
    done: false, created: Date.now(), kind: h.kind || '', minutes: h.minutes || 0, repeat: h.repeat,
    tags: [...(h.tags || [])],
    subtasks: (h.subtasks || []).map((s) => ({ id: uid(), text: s.text, done: false })),
    attachments: (h.attachments || []).map((a) => ({ ...a })),
  };
}

function setDone(h, done) {
  h.done = done;
  h.doneAt = done ? Date.now() : null;
  if (done && h.repeat && h.date) {
    if (!(h.spawned && state.homework.some((x) => x.id === h.spawned))) {
      const n = cloneForRepeat(h, nextOccurrence(h));
      state.homework.push(n);
      h.spawned = n.id;
      showToast(`Prochain devoir créé pour le ${formatDate(n.date)}`);
    }
  } else if (!done && h.spawned) {
    const n = state.homework.find((x) => x.id === h.spawned);
    if (n && !n.done) state.homework = state.homework.filter((x) => x !== n);
    delete h.spawned;
  }
}

// ---------- Éléments communs à la liste et au détail ----------
const URL_RE = /https?:\/\/[^\s<>"']+/g;

// Texte avec liens cliquables (ouverts dans le navigateur, jamais dans l'appli)
function linkify(text, container) {
  let last = 0;
  let m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text))) {
    let url = m[0];
    const trail = /[.,;:!?)\]]+$/.exec(url);
    if (trail) url = url.slice(0, -trail[0].length);
    if (m.index > last) container.append(text.slice(last, m.index));
    const a = el('a', 'ext-link', url);
    a.setAttribute('role', 'link');
    a.tabIndex = 0;
    a.title = 'Ouvrir le lien';
    const open = (e) => { e.preventDefault(); e.stopPropagation(); window.devoirsAPI.openLink(url); };
    a.addEventListener('click', open);
    a.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(e); });
    container.append(a);
    last = m.index + url.length;
    URL_RE.lastIndex = last;
  }
  if (last < text.length) container.append(text.slice(last));
  return container;
}

function subProgress(h) {
  const subs = h.subtasks || [];
  return `${subs.filter((s) => s.done).length}/${subs.length}`;
}

function searchTag(tag) {
  if ($('viewDialog').open) $('viewDialog').close();
  $('search').value = '#' + tag;
  state.search = '#' + tag;
  renderView();
}

function buildMeta(h, opts) {
  const meta = el('div', 'meta');
  const k = KINDS[h.kind];
  if (k) meta.append(el('span', 'tag kind', `${k.emoji} ${k.label}`));
  if (h.subject) {
    const t = el('span', 'tag subject');
    t.style.setProperty('--c', subjectColor(h.subject));
    t.append(el('span', 'dot'), h.subject);
    meta.append(t);
  }
  if (h.date) {
    const due = opts.due && !h.done ? dueLabel(h.date) : { text: formatDate(h.date), cls: '' };
    const tag = el('span', 'tag ' + due.cls);
    tag.append(mkIcon('calendar'), due.text);
    meta.append(tag);
  }
  if (h.priority > 1) meta.append(el('span', 'tag p' + h.priority, PRIORITY_LABELS[h.priority]));
  if (h.minutes) {
    const t = el('span', 'tag');
    t.append(mkIcon('clock'), fmtMinutes(h.minutes));
    t.title = 'Durée estimée';
    meta.append(t);
  }
  if (typeof h.grade === 'number') {
    const t = el('span', 'tag grade', `Note ${fmtNum(h.grade)}/${fmtNum(h.gradeMax > 0 ? h.gradeMax : 20)}`);
    t.title = `Coefficient ${fmtNum(h.coef > 0 ? h.coef : 1)}`;
    meta.append(t);
  }
  if ((h.subtasks || []).length) {
    const t = el('span', 'tag sub-progress');
    t.dataset.id = h.id;
    t.append(mkIcon('check'), subProgress(h));
    t.title = 'Sous-tâches terminées';
    meta.append(t);
  }
  if (h.repeat && REPEATS[h.repeat]) {
    const t = el('span', 'tag');
    t.append(mkIcon('repeat'), REPEATS[h.repeat]);
    meta.append(t);
  }
  (h.tags || []).forEach((name) => {
    const b = button('tag hash', '#' + name);
    b.title = 'Voir les devoirs avec cette étiquette';
    b.addEventListener('click', (e) => { e.stopPropagation(); searchTag(name); });
    meta.append(b);
  });
  return meta;
}

function buildSubtasks(h) {
  const subs = h.subtasks || [];
  if (!subs.length) return null;
  const ul = el('ul', 'subs');
  subs.forEach((s) => {
    const li = el('li', s.done ? 'done' : '');
    const label = el('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'check sm';
    cb.checked = !!s.done;
    cb.addEventListener('change', () => {
      s.done = cb.checked;
      li.classList.toggle('done', s.done);
      document.querySelectorAll(`.sub-progress[data-id="${h.id}"]`).forEach((t) => { t.lastChild.textContent = subProgress(h); });
      persist();
    });
    label.append(cb, el('span', null, s.text));
    li.append(label);
    ul.append(li);
  });
  return ul;
}

async function openAttachment(f) {
  const r = await window.devoirsAPI.openFile(f.path);
  if (r && r.ok) return;
  const why = {
    missing: `Fichier introuvable : ${f.name}`,
    unsafe: "Ce type de fichier ne peut pas être ouvert depuis l'application.",
  };
  showToast((r && why[r.reason]) || `Impossible d'ouvrir ${f.name}`);
}

function buildFiles(h) {
  const files = h.attachments || [];
  if (!files.length) return null;
  const box = el('div', 'files');
  files.forEach((f) => {
    const b = button('file-chip');
    b.append(mkIcon('paperclip'), el('span', null, f.name));
    b.title = f.path;
    b.addEventListener('click', (e) => { e.stopPropagation(); openAttachment(f); });
    box.append(b);
  });
  return box;
}

// ---------- Matières ----------
function sameName(a, b) {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}

function findSubject(name) {
  if (!name) return null;
  return state.settings.subjects.find((s) => sameName(s.name, name)) || null;
}

function subjectColor(name) {
  const s = findSubject(name);
  return s ? s.color : NEUTRAL;
}

function nextFreeColor() {
  const used = new Set(state.settings.subjects.map((s) => s.color));
  const free = SUBJECT_COLORS.find((c) => !used.has(c.value));
  return (free || SUBJECT_COLORS[state.settings.subjects.length % SUBJECT_COLORS.length]).value;
}

function countUsing(name) {
  return state.homework.filter((h) => sameName(h.subject, name)).length;
}

function addSubject(rawName, color) {
  const name = rawName.trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, msg: 'Écris un nom de matière.' };
  if (findSubject(name)) return { ok: false, msg: 'Cette matière existe déjà.' };
  state.settings.subjects.push({ id: uid(), name, color });
  persist();
  return { ok: true, name };
}

function removeSubject(subject) {
  const n = countUsing(subject.name);
  if (n > 0) {
    const ok = confirm(
      `« ${subject.name} » est utilisée par ${n} devoir${n > 1 ? 's' : ''}.\n` +
      `${n > 1 ? 'Ils garderont' : 'Il gardera'} le nom de la matière, mais sans couleur.\n\nRetirer cette matière ?`
    );
    if (!ok) return false;
  }
  state.settings.subjects = state.settings.subjects.filter((s) => s.id !== subject.id);
  if (state.subject !== null && sameName(state.subject, subject.name)) state.subject = null;
  if (sameName(pickedSubject, subject.name)) pickedSubject = '';
  persist();
  return true;
}

function setSubjectColor(subject, color) {
  subject.color = color;
  persist();
}

function buildInitialSubjects(homework) {
  const list = DEFAULT_SUBJECTS.map((s) => ({ id: uid(), name: s.name, color: s.color }));
  // Garde les matières déjà utilisées dans des devoirs existants, avec leur ancienne couleur
  const seen = new Set(list.map((s) => s.name.toLowerCase()));
  homework.forEach((h) => {
    const name = (h.subject || '').trim();
    if (!name || seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.toLowerCase().charCodeAt(i)) >>> 0;
    list.push({ id: uid(), name, color: LEGACY_PALETTE[hash % LEGACY_PALETTE.length] });
  });
  return list;
}

// Palette de couleurs réutilisable
function renderPalette(container, selected, onPick) {
  container.textContent = '';
  SUBJECT_COLORS.forEach((c) => {
    const b = button('swatch' + (c.value === selected ? ' on' : ''));
    b.style.setProperty('--c', c.value);
    b.title = c.name;
    b.setAttribute('aria-label', c.name);
    b.addEventListener('click', () => onPick(c.value));
    container.append(b);
  });

  // Sélecteur de couleur avancé (n'importe quelle couleur)
  const isHex = typeof selected === 'string' && /^#[0-9a-f]{6}$/i.test(selected);
  const isCustom = isHex && !SUBJECT_COLORS.some((c) => c.value.toLowerCase() === selected.toLowerCase());
  const custom = el('label', 'swatch custom' + (isCustom ? ' on picked' : ''));
  custom.style.setProperty('--c', isCustom ? selected : '#888888');
  custom.title = 'Couleur personnalisée';
  const input = el('input');
  input.type = 'color';
  input.value = isHex ? selected.toLowerCase() : SUBJECT_COLORS[0].value;
  input.setAttribute('aria-label', 'Choisir une couleur personnalisée');
  input.addEventListener('change', () => onPick(input.value));
  custom.append(input);
  container.append(custom);
}

// ---------- Filtrage ----------
function searchText(h) {
  const k = KINDS[h.kind];
  return [h.title, h.subject, h.notes, k && k.label, ...(h.tags || []).map((t) => '#' + t), ...(h.subtasks || []).map((s) => s.text)]
    .filter(Boolean).join(' ').toLowerCase();
}

function visibleItems() {
  const q = state.search.trim().toLowerCase();
  const items = state.homework.filter((h) => {
    if (state.subject !== null && !sameName(h.subject, state.subject)) return false;
    if (q && !searchText(h).includes(q)) return false;
    switch (state.filter) {
      case 'today': return isTodayOrTomorrow(h);
      case 'todo': return !h.done;
      case 'late': return isLate(h);
      case 'week': return isThisWeek(h);
      case 'done': return h.done;
      default: return true;
    }
  });

  const byDate = (a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  };

  items.sort((a, b) => {
    if (state.filter === 'all' && a.done !== b.done) return a.done ? 1 : -1;
    switch (state.sort) {
      case 'priority': return (b.priority - a.priority) || byDate(a, b);
      case 'subject': return (a.subject || '').localeCompare(b.subject || '', 'fr') || byDate(a, b);
      case 'created': return (b.created || 0) - (a.created || 0);
      case 'custom': return ordOf(a) - ordOf(b);
      default: return byDate(a, b) || (b.priority - a.priority);
    }
  });
  return items;
}

// ---------- Rendu ----------
function renderCounts() {
  const hw = state.homework;
  $('c-today').textContent = hw.filter(isTodayOrTomorrow).length;
  $('c-todo').textContent = hw.filter((h) => !h.done).length;
  $('c-late').textContent = hw.filter(isLate).length;
  $('c-week').textContent = hw.filter(isThisWeek).length;
  $('c-done').textContent = hw.filter((h) => h.done).length;
  $('c-all').textContent = hw.length;

  const todo = hw.filter((h) => !h.done).length;
  const late = hw.filter(isLate).length;
  const stats = $('stats');
  stats.textContent = '';
  stats.append(el('strong', null, String(todo)), ` devoir${todo > 1 ? 's' : ''} à faire`);
  if (late > 0) {
    stats.append(' · ');
    const s2 = el('strong', null, String(late));
    s2.style.color = 'var(--danger)';
    stats.append(s2, ' en retard');
  }
  const mins = hw.reduce((sum, h) => sum + (h.done ? 0 : (h.minutes || 0)), 0);
  if (mins > 0) stats.append(` · ≈ ${fmtMinutes(mins)} de travail`);

  let title = FILTER_LABELS[state.filter];
  if (state.subject !== null) title += ' · ' + state.subject;
  $('pageTitle').textContent = title;
}

function renderSubjects() {
  const box = $('subjectList');
  box.textContent = '';
  const subjects = [...state.settings.subjects].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  if (subjects.length === 0) {
    box.append(el('div', 'muted', 'Aucune matière. Ajoutes-en avec le crayon.'));
    return;
  }

  const all = button(state.subject === null ? 'active' : '');
  all.append(el('span', 'dot'), el('span', 'name', 'Toutes'));
  all.addEventListener('click', () => { state.subject = null; render(); });
  box.append(all);

  subjects.forEach((s) => {
    const b = button(state.subject !== null && sameName(state.subject, s.name) ? 'active' : '');
    b.style.setProperty('--c', s.color);
    const todo = state.homework.filter((h) => !h.done && sameName(h.subject, s.name)).length;
    b.append(el('span', 'dot'), el('span', 'name', s.name));
    if (todo > 0) b.append(el('span', 'n', String(todo)));
    b.addEventListener('click', () => {
      state.subject = state.subject !== null && sameName(state.subject, s.name) ? null : s.name;
      render();
    });
    box.append(b);
  });
}

let selectMode = false;
const selected = new Set();
let kbId = null;
let listDragId = null;
const ordOf = (h) => (h.order != null ? h.order : (h.created || 0));

function renderList() {
  const list = $('list');
  list.textContent = '';
  const items = visibleItems();
  list.classList.toggle('selecting', selectMode);
  list.classList.toggle('reorder', !selectMode && state.sort === 'custom');

  $('empty').hidden = items.length > 0;
  if (items.length === 0) {
    const msgs = {
      today: ['🎉', "Rien à faire aujourd'hui ni demain."],
      todo: ['🎉', 'Aucun devoir à faire. Profites-en !'],
      late: ['👍', 'Aucun devoir en retard.'],
      week: ['😎', 'Rien de prévu cette semaine.'],
      done: ['📭', "Aucun devoir terminé pour l'instant."],
      all: ['📝', 'Ajoute ton premier devoir avec « Nouveau devoir ».'],
    };
    const [emoji, text] = state.search || state.subject !== null ? ['🔍', 'Aucun résultat.'] : msgs[state.filter];
    document.querySelector('.empty-emoji').textContent = emoji;
    $('emptyText').textContent = text;
    return;
  }

  const addItem = (h) => {
    const color = subjectColor(h.subject);
    const li = el('li', 'item' + (h.done ? ' done' : ''));
    li.style.setProperty('--c', color);
    li.dataset.id = h.id;
    if (kbId === h.id) li.classList.add('kb');
    if (selectMode && selected.has(h.id)) li.classList.add('sel');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'check';
    cb.checked = selectMode ? selected.has(h.id) : !!h.done;
    cb.setAttribute('aria-label', 'Marquer comme terminé');
    cb.addEventListener('change', () => {
      if (selectMode) {
        if (cb.checked) selected.add(h.id); else selected.delete(h.id);
        li.classList.toggle('sel', cb.checked);
        renderBulk();
        return;
      }
      setDone(h, cb.checked);
      persist();
      render();
    });

    const body = el('div', 'body');
    body.append(el('div', 'title', h.title));
    if (h.notes) body.append(linkify(h.notes, el('div', 'notes')));
    const subs = buildSubtasks(h);
    if (subs) body.append(subs);
    body.append(buildMeta(h, { due: true }));
    const files = buildFiles(h);
    if (files) body.append(files);

    const btns = el('div', 'btns');
    const edit = button(null);
    edit.append(mkIcon('edit'));
    edit.title = 'Modifier';
    edit.setAttribute('aria-label', 'Modifier');
    edit.addEventListener('click', () => openDialog(h.id));
    const del = button('del');
    del.append(mkIcon('trash'));
    del.title = 'Supprimer';
    del.setAttribute('aria-label', 'Supprimer');
    del.addEventListener('click', () => {
      if (!state.settings.confirmDelete || confirm(`Supprimer « ${h.title} » ?`)) deleteItems([h], 'Devoir supprimé');
    });
    const dup = button(null);
    dup.append(mkIcon('copy'));
    dup.title = 'Dupliquer';
    dup.setAttribute('aria-label', 'Dupliquer');
    dup.addEventListener('click', () => openDialog(null, undefined, h));
    const tm = button(null);
    tm.append(mkIcon('clock'));
    tm.title = 'Minuteur de travail (25 min)';
    tm.setAttribute('aria-label', 'Minuteur de travail');
    tm.addEventListener('click', () => startTimer(h));
    btns.append(tm, dup, edit, del);

    li.append(cb, body, btns);
    if (selectMode) {
      li.addEventListener('click', (e) => { if (!e.target.closest('a,button,input')) cb.click(); });
    } else if (state.sort === 'custom') {
      li.draggable = true;
      li.addEventListener('dragstart', (e) => { listDragId = h.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', h.id); });
      li.addEventListener('dragover', (e) => { if (listDragId) { e.preventDefault(); li.classList.add('over'); } });
      li.addEventListener('dragleave', () => li.classList.remove('over'));
      li.addEventListener('drop', (e) => { e.preventDefault(); li.classList.remove('over'); if (listDragId) reorderTo(listDragId, h.id); listDragId = null; });
      li.addEventListener('dragend', () => { listDragId = null; });
    }
    list.append(li);
  };
  if (state.filter === 'today') renderTodayGroups(items, addItem, list);
  else items.forEach(addItem);
}

// Page « Aujourd'hui » : deux blocs (aujourd'hui, demain) avec les cours du jour et le temps de travail
function renderTodayGroups(items, addItem, list) {
  const late = state.homework.filter(isLate).length;
  if (late > 0) {
    const li = el('li', 'late-notice');
    const b = button(null, `⚠ ${late} devoir${late > 1 ? 's' : ''} en retard — Voir`);
    b.addEventListener('click', () => { state.filter = 'late'; render(); });
    li.append(b);
    list.append(li);
  }
  const today = todayStr();
  [[today, "Aujourd'hui"], [shiftDate(today, 1), 'Demain']].forEach(([date, label]) => {
    const group = items.filter((h) => h.date === date);
    const head = el('li', 'group-head');
    head.append(el('strong', null, label), el('span', 'gh-date', formatDate(date)));
    const classes = classesOn(date);
    if (classes.length) head.append(el('span', 'gh-classes', 'Cours : ' + classes.join(', ')));
    const mins = group.reduce((sum, h) => sum + (h.minutes || 0), 0);
    if (mins > 0) head.append(el('span', 'gh-time', '≈ ' + fmtMinutes(mins)));
    list.append(head);
    if (group.length === 0) list.append(el('li', 'group-empty', 'Rien à faire.'));
    else group.forEach(addItem);
  });
}

// ---------- Détail d'un devoir (calendrier) ----------
let viewingId = null;

function openView(id) {
  const h = state.homework.find((x) => x.id === id);
  if (!h) return;
  viewingId = id;
  const color = subjectColor(h.subject);
  const box = $('vBody');
  box.textContent = '';
  box.style.setProperty('--c', color);

  const top = el('label', 'v-top');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'check';
  cb.checked = !!h.done;
  cb.setAttribute('aria-label', 'Marquer comme terminé');
  const title = el('span', 'v-title' + (h.done ? ' done' : ''), h.title);
  cb.addEventListener('change', () => {
    setDone(h, cb.checked);
    title.classList.toggle('done', h.done);
    persist();
    render();
  });
  top.append(cb, title);
  box.append(top);

  box.append(buildMeta(h, { due: false }));
  if (h.notes) box.append(linkify(h.notes, el('div', 'v-notes')));
  const subs = buildSubtasks(h);
  if (subs) box.append(subs);
  const files = buildFiles(h);
  if (files) box.append(files);

  if (!$('viewDialog').open) $('viewDialog').showModal();
  cb.focus(); // Espace coche / décoche
}

$('vClose').addEventListener('click', () => $('viewDialog').close());
$('vCancel').addEventListener('click', () => $('viewDialog').close());
$('vDup').addEventListener('click', () => {
  const h = state.homework.find((x) => x.id === viewingId);
  $('viewDialog').close();
  if (h) openDialog(null, undefined, h);
});
$('vEdit').addEventListener('click', () => {
  const id = viewingId;
  $('viewDialog').close();
  if (id) openDialog(id);
});

// ---------- Calendrier ----------
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mondayOf(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
}

function calTitleText() {
  const a = state.calAnchor;
  if (state.calMode === 'month') {
    const t = new Date(a.getFullYear(), a.getMonth(), 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  const s = mondayOf(a);
  const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 4); // vendredi
  const mon = (d, style) => d.toLocaleDateString('fr-FR', { month: style });
  if (s.getFullYear() !== e.getFullYear()) return `${s.getDate()} ${mon(s, 'short')} ${s.getFullYear()} – ${e.getDate()} ${mon(e, 'short')} ${e.getFullYear()}`;
  if (s.getMonth() !== e.getMonth()) return `${s.getDate()} ${mon(s, 'short')} – ${e.getDate()} ${mon(e, 'short')} ${e.getFullYear()}`;
  return `${s.getDate()} – ${e.getDate()} ${mon(e, 'long')} ${e.getFullYear()}`;
}

let dragId = null;
function moveHomework(id, date) {
  const h = state.homework.find((x) => x.id === id);
  if (!h || h.date === date) return;
  const old = h.date;
  h.date = date;
  persist();
  render();
  pushUndo(`« ${h.title} » déplacé au ${formatDate(date)}`, () => { h.date = old; });
}

function renderCalendar() {
  const week = state.calMode === 'week';
  $('calTitle').textContent = calTitleText();
  $('calPrev').title = $('calPrev').ariaLabel = week ? 'Semaine précédente' : 'Mois précédent';
  $('calNext').title = $('calNext').ariaLabel = week ? 'Semaine suivante' : 'Mois suivant';
  document.querySelectorAll('#calModeSeg button').forEach((b) => {
    const on = b.dataset.mode === state.calMode;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });

  const items = visibleItems();
  const byDay = new Map();
  let undated = 0;
  items.forEach((h) => {
    if (!h.date) { undated++; return; }
    if (!byDay.has(h.date)) byDay.set(h.date, []);
    byDay.get(h.date).push(h);
  });
  const notes = [];
  if (week) {
    // Les devoirs du samedi et du dimanche ne sont pas dans la grille : on le signale
    const mon = mondayOf(state.calAnchor);
    let weekend = 0;
    [5, 6].forEach((d) => { weekend += (byDay.get(ymd(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + d))) || []).length; });
    if (weekend > 0) notes.push(`${weekend} devoir${weekend > 1 ? 's' : ''} le week-end (non affiché${weekend > 1 ? 's' : ''})`);
  }
  if (undated > 0) notes.push(`${undated} devoir${undated > 1 ? 's' : ''} sans date (visible${undated > 1 ? 's' : ''} dans la liste)`);
  $('calNote').textContent = notes.join(' · ');

  // Semaines commençant le lundi
  let start;
  let weeks;
  const month = state.calAnchor.getMonth();
  if (week) {
    start = mondayOf(state.calAnchor);
    weeks = 1;
  } else {
    const y = state.calAnchor.getFullYear();
    const first = new Date(y, month, 1);
    const offset = (first.getDay() + 6) % 7;
    start = new Date(y, month, 1 - offset);
    weeks = Math.ceil((offset + new Date(y, month + 1, 0).getDate()) / 7);
  }

  const grid = $('calGrid');
  grid.textContent = '';
  grid.classList.toggle('week', week);
  grid.style.gridTemplateRows = `auto repeat(${weeks}, minmax(0, 1fr))`;
  const days = week ? 5 : 7; // semaine = lundi à vendredi
  grid.style.gridTemplateColumns = `repeat(${days}, minmax(0, 1fr))`;
  const DOW = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const today = todayStr();

  if (week) {
    for (let i = 0; i < days; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const head = el('div', 'cal-dow wk' + (ymd(date) === today ? ' today' : ''));
      head.append(el('span', null, DOW[i]), el('span', 'cal-num', String(date.getDate())));
      grid.append(head);
    }
  } else {
    DOW.forEach((d) => grid.append(el('div', 'cal-dow', d)));
  }

  for (let i = 0; i < weeks * days; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = ymd(date);
    const cell = el('div', 'cal-day' + (!week && date.getMonth() !== month ? ' other' : '') + (key === today ? ' today' : ''));
    cell.title = 'Ajouter un devoir ce jour-là';
    if (!week) cell.append(el('div', 'cal-num', String(date.getDate())));

    const box = el('div', 'cal-items');
    (byDay.get(key) || []).forEach((h) => {
      const cls = 'cal-chip' + (h.done ? ' done' : '') + (isLate(h) ? ' late' : '');
      const chip = button(cls);
      const ke = KINDS[h.kind] ? KINDS[h.kind].emoji + ' ' : '';
      if (week) {
        if (h.subject) chip.append(el('span', 'cs', h.subject));
        chip.append(el('span', 'ct', ke + h.title));
        if (h.priority > 1) chip.append(el('span', 'cp p' + h.priority, PRIORITY_LABELS[h.priority]));
      } else {
        chip.textContent = ke + (h.subject ? h.subject + ' · ' : '') + h.title;
      }
      chip.style.setProperty('--c', subjectColor(h.subject));
      chip.title = h.title + (h.notes ? '\n' + h.notes : '');
      chip.addEventListener('click', (e) => { e.stopPropagation(); openView(h.id); });
      // Glisser le devoir vers un autre jour pour changer sa date
      chip.draggable = true;
      chip.addEventListener('dragstart', (e) => {
        dragId = h.id;
        e.dataTransfer.setData('text/plain', h.id);
        e.dataTransfer.effectAllowed = 'move';
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', () => {
        dragId = null;
        chip.classList.remove('dragging');
        document.querySelectorAll('.cal-day.drop').forEach((c) => c.classList.remove('drop'));
      });
      box.append(chip);
    });
    cell.append(box);
    const mins = (byDay.get(key) || []).reduce((sum, h) => sum + (h.done ? 0 : (h.minutes || 0)), 0);
    if (mins > 0) {
      const tot = el('span', 'cal-total', fmtMinutes(mins));
      tot.title = 'Temps de travail estimé ce jour-là';
      cell.append(tot);
    }
    cell.addEventListener('dragover', (e) => {
      if (!dragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      cell.classList.add('drop');
    });
    cell.addEventListener('dragleave', (e) => { if (!cell.contains(e.relatedTarget)) cell.classList.remove('drop'); });
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drop');
      if (dragId) moveHomework(dragId, key);
      dragId = null;
    });
    cell.addEventListener('click', () => openDialog(null, key));
    grid.append(cell);
  }
}

function renderView() {
  const cal = state.view === 'calendar';
  $('calendar').hidden = !cal;
  $('list').hidden = cal;
  $('sort').hidden = cal;
  $('selBtn').hidden = cal;
  if (cal && selectMode) setSelectMode(false);
  document.querySelectorAll('#viewSeg button').forEach((b) => {
    const on = b.dataset.view === state.view;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });
  if (cal) { $('empty').hidden = true; renderCalendar(); } else { renderList(); }
}

function render() {
  document.querySelectorAll('#filters button').forEach((b) => {
    b.classList.toggle('active', b.dataset.filter === state.filter);
  });
  renderCounts();
  renderSubjects();
  renderView();
}

// ---------- Thème ----------
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function resolvedTheme() {
  const t = state.settings.theme;
  if (t === 'auto') return darkQuery.matches ? 'dark' : 'light';
  if (t === 'time') { const hr = new Date().getHours(); return hr >= 7 && hr < 19 ? 'light' : 'dark'; }
  return t === 'dark' ? 'dark' : 'light';
}

function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.4 ? '#10131c' : '#ffffff';
}

function applyTheme() {
  const theme = resolvedTheme();
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.zoom = String((state.settings.fontScale || 100) / 100);
  document.body.classList.toggle('compact', !!state.settings.compact);
  $('s-compact').checked = !!state.settings.compact;
  document.querySelectorAll('#fontSeg button').forEach((b) => {
    const on = Number(b.dataset.scale) === (state.settings.fontScale || 100);
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });
  const accent = ACCENTS.find((a) => a.id === state.settings.accent) || ACCENTS[0];
  const color = theme === 'dark' ? accent.dark : accent.light;
  root.style.setProperty('--accent', color);
  root.style.setProperty('--accent-text', textOn(color));
  setIcon($('themeBtn').firstElementChild, theme === 'dark' ? 'sun' : 'moon');

  document.querySelectorAll('#themeSeg button').forEach((b) => {
    const on = b.dataset.theme === state.settings.theme;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });
  renderAccents();
}

darkQuery.addEventListener('change', () => { if (state.settings.theme === 'auto') applyTheme(); });

function renderAccents() {
  const box = $('accentList');
  box.textContent = '';
  const theme = resolvedTheme();
  ACCENTS.forEach((a) => {
    const b = button('swatch' + (a.id === state.settings.accent ? ' on' : ''));
    b.style.setProperty('--c', theme === 'dark' ? a.dark : a.light);
    b.title = a.name;
    b.setAttribute('aria-label', a.name);
    b.addEventListener('click', () => {
      state.settings.accent = a.id;
      persist();
      applyTheme();
    });
    box.append(b);
  });
}

// ---------- Ajouter / modifier un devoir ----------
let pickedSubject = '';
let pickedPriority = '1';
let quickColor = SUBJECT_COLORS[0].value;

function renderPicker() {
  const box = $('f-subjects');
  box.textContent = '';
  const list = [...state.settings.subjects];
  if (pickedSubject && !findSubject(pickedSubject)) list.push({ id: 'orphan', name: pickedSubject, color: NEUTRAL });

  // Emploi du temps : les matières qui ont cours le jour choisi passent devant
  const date = $('f-date').value;
  const today = date ? classesOn(date) : [];
  if (today.length) list.sort((a, b) => (today.includes(b.name) ? 1 : 0) - (today.includes(a.name) ? 1 : 0));
  const hint = $('f-subject-hint');
  hint.hidden = today.length === 0;
  hint.textContent = today.length ? `Cours le ${DAY_NAMES[isoDow(date) - 1]} : ${today.join(', ')}` : '';

  list.forEach((s) => {
    const on = sameName(s.name, pickedSubject);
    const b = button('chip' + (on ? ' on' : ''));
    b.style.setProperty('--c', s.color);
    if (today.includes(s.name)) { b.classList.add('suggest'); b.title = 'Cours ce jour-là'; }
    b.setAttribute('aria-pressed', String(on));
    b.append(el('span', 'dot'), s.name);
    if (on) b.append(mkIcon('check'));
    b.addEventListener('click', () => {
      pickedSubject = on ? '' : s.name;
      renderPicker();
    });
    box.append(b);
  });

  const add = button('chip add');
  add.append(mkIcon('plus'), 'Nouvelle matière');
  add.addEventListener('click', openQuickAdd);
  box.append(add);
}

function renderQuickPalette() {
  renderPalette($('qa-palette'), quickColor, (c) => { quickColor = c; renderQuickPalette(); });
}

function openQuickAdd() {
  quickColor = nextFreeColor();
  $('qa-name').value = '';
  $('qa-err').textContent = '';
  renderQuickPalette();
  $('quickAdd').hidden = false;
  $('qa-name').focus();
}

function closeQuickAdd() {
  $('quickAdd').hidden = true;
}

function submitQuickAdd() {
  const r = addSubject($('qa-name').value, quickColor);
  if (!r.ok) { $('qa-err').textContent = r.msg; return; }
  pickedSubject = r.name;
  closeQuickAdd();
  renderPicker();
  render();
}

function setPriority(value) {
  pickedPriority = String(value);
  document.querySelectorAll('#f-priority button').forEach((b) => {
    const on = b.dataset.value === pickedPriority;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });
}

let pickedKind = '';
let formSubs = [];
let formTags = [];
let formFiles = [];

function setKind(value) {
  pickedKind = KINDS[value] ? value : '';
  document.querySelectorAll('#f-kind button').forEach((b) => {
    const on = b.dataset.value === pickedKind;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });
  $('f-grade-box').hidden = !pickedKind; // la note n'a de sens que pour un contrôle ou un exposé
}

// La répétition a besoin d'une date
function updateRepeatField() {
  const has = !!$('f-date').value;
  $('f-repeat').disabled = !has;
  if (!has) $('f-repeat').value = '';
  $('f-repeat-hint').textContent = !has ? "Choisis d'abord une date."
    : $('f-repeat').value ? 'Quand tu le coches, le prochain est créé automatiquement.' : '';
}

function renderFormSubs() {
  const ul = $('f-subs');
  ul.textContent = '';
  formSubs.forEach((s, i) => {
    const li = el('li');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'check sm';
    cb.checked = !!s.done;
    cb.setAttribute('aria-label', 'Étape terminée');
    cb.addEventListener('change', () => { s.done = cb.checked; });
    const del = button('mini-del');
    del.append(mkIcon('x'));
    del.title = 'Retirer';
    del.setAttribute('aria-label', 'Retirer cette étape');
    del.addEventListener('click', () => { formSubs.splice(i, 1); renderFormSubs(); });
    li.append(cb, el('span', 'grow', s.text), del);
    ul.append(li);
  });
}

function addFormSub() {
  const text = $('f-sub-input').value.trim();
  if (!text || formSubs.length >= 30) return;
  formSubs.push({ id: uid(), text, done: false });
  $('f-sub-input').value = '';
  renderFormSubs();
}

function renderFormTags() {
  const box = $('f-tags');
  box.textContent = '';
  formTags.forEach((name, i) => {
    const b = button('chip on');
    b.style.setProperty('--c', 'var(--accent)');
    b.append('#' + name, mkIcon('x'));
    b.title = 'Retirer cette étiquette';
    b.addEventListener('click', () => { formTags.splice(i, 1); renderFormTags(); });
    box.append(b);
  });
}

function addFormTags(raw) {
  String(raw || '').split(/[,;]/).forEach((t) => {
    const name = t.replace(/^#+/, '').trim().slice(0, 30);
    if (name && formTags.length < 10 && !formTags.some((x) => sameName(x, name))) formTags.push(name);
  });
  renderFormTags();
}

function renderFormFiles() {
  const ul = $('f-files');
  ul.textContent = '';
  formFiles.forEach((f, i) => {
    const li = el('li');
    li.append(mkIcon('paperclip'));
    const name = el('span', 'grow', f.name);
    name.title = f.path;
    const del = button('mini-del');
    del.append(mkIcon('x'));
    del.title = 'Retirer';
    del.setAttribute('aria-label', 'Retirer ce fichier');
    del.addEventListener('click', () => { formFiles.splice(i, 1); renderFormFiles(); });
    li.append(name, del);
    ul.append(li);
  });
  $('f-file-add').hidden = formFiles.length >= 10;
}

// id : devoir à modifier — template : devoir à copier (nouveau devoir prérempli)
function openDialog(id, presetDate, template) {
  state.editingId = id || null;
  const h = id ? state.homework.find((x) => x.id === id) : null;
  const src = h || template || null;
  const copy = !h && !!template;
  $('dialogTitle').textContent = h ? 'Modifier le devoir' : copy ? 'Dupliquer le devoir' : 'Nouveau devoir';
  $('f-title').value = src ? src.title : '';
  $('f-date').value = src ? src.date || '' : (presetDate || '');
  $('f-notes').value = src ? src.notes || '' : '';
  $('f-minutes').value = src && src.minutes ? src.minutes : '';
  $('f-repeat').value = src && src.repeat ? src.repeat : '';
  setKind(src ? src.kind : '');
  const graded = !!src && !copy && typeof src.grade === 'number';
  $('f-grade').value = graded ? src.grade : '';
  $('f-grade-max').value = graded && src.gradeMax ? src.gradeMax : '';
  $('f-coef').value = graded && src.coef ? src.coef : '';
  setPriority(src ? (src.priority || 1) : (state.settings.defaultPriority || 1));
  pickedSubject = src ? src.subject || '' : (state.subject || '');
  formSubs = ((src && src.subtasks) || []).map((s) => ({ id: copy ? uid() : s.id, text: s.text, done: copy ? false : !!s.done }));
  formTags = [...((src && src.tags) || [])];
  formFiles = ((src && src.attachments) || []).map((a) => ({ ...a }));
  $('f-sub-input').value = '';
  $('f-tag-input').value = '';
  const known = new Set();
  state.homework.forEach((x) => (x.tags || []).forEach((t) => known.add(t)));
  $('tag-list').textContent = '';
  [...known].sort((a, b) => a.localeCompare(b, 'fr')).forEach((t) => { const o = document.createElement('option'); o.value = t; $('tag-list').append(o); });
  updateRepeatField();
  renderFormSubs();
  renderFormTags();
  renderFormFiles();
  closeQuickAdd();
  renderPicker();
  $('dialog').showModal();
  $('f-title').focus();
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('f-title').value.trim();
  if (!title) return;
  addFormSub(); // ce qui est tapé mais pas encore ajouté
  addFormTags($('f-tag-input').value);
  const date = $('f-date').value;
  const gradeText = $('f-grade').value.trim();
  const grade = pickedKind && gradeText !== '' && Number.isFinite(Number(gradeText)) ? Math.max(0, Number(gradeText)) : null;
  const data = {
    title,
    subject: pickedSubject,
    date,
    priority: Number(pickedPriority) || 1,
    notes: $('f-notes').value.trim(),
    kind: pickedKind,
    minutes: Math.max(0, Math.min(1440, Math.round(Number($('f-minutes').value) || 0))),
    repeat: date ? $('f-repeat').value : '',
    tags: formTags.slice(),
    subtasks: formSubs.map((s) => ({ ...s })),
    attachments: formFiles.map((a) => ({ ...a })),
    grade,
    gradeMax: grade === null ? null : (Number($('f-grade-max').value) > 0 ? Number($('f-grade-max').value) : 20),
    coef: grade === null ? null : (Number($('f-coef').value) > 0 ? Number($('f-coef').value) : 1),
  };
  if (state.editingId) {
    const h = state.homework.find((x) => x.id === state.editingId);
    if (h) Object.assign(h, data);
  } else {
    state.homework.push({ id: uid(), done: false, created: Date.now(), ...data });
  }
  persist();
  $('dialog').close();
  render();
});

$('f-kind').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-value]');
  if (b) setKind(b.dataset.value);
});
$('f-date').addEventListener('input', updateRepeatField);
$('f-date').addEventListener('input', renderPicker);
$('f-repeat').addEventListener('change', updateRepeatField);
$('f-sub-add').addEventListener('click', addFormSub);
$('f-sub-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addFormSub(); } });
$('f-tag-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addFormTags($('f-tag-input').value); $('f-tag-input').value = ''; }
});
$('f-tag-input').addEventListener('input', (e) => {
  if (e.inputType === 'insertReplacementText') { addFormTags($('f-tag-input').value); $('f-tag-input').value = ''; } // choix dans la liste
});
$('f-file-add').addEventListener('click', async () => {
  const picked = await window.devoirsAPI.pickFiles();
  (picked || []).forEach((f) => {
    if (formFiles.length < 10 && !formFiles.some((x) => x.path === f.path)) formFiles.push(f);
  });
  renderFormFiles();
});

$('cancelBtn').addEventListener('click', () => $('dialog').close());
$('dlgClose').addEventListener('click', () => $('dialog').close());
$('f-priority').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-value]');
  if (b) setPriority(b.dataset.value);
});
$('qa-ok').addEventListener('click', submitQuickAdd);
$('qa-cancel').addEventListener('click', closeQuickAdd);
$('qa-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); submitQuickAdd(); }
  if (e.key === 'Escape' && !$('quickAdd').hidden) { e.preventDefault(); e.stopPropagation(); closeQuickAdd(); }
});
$('manageFromDialog').addEventListener('click', () => openSettings('subjects'));

// ---------- Paramètres ----------
let colorEditing = null; // id de la matière dont on change la couleur
let newSubjectColor = SUBJECT_COLORS[0].value;

function showTab(tab) {
  if (tab === 'schedule') renderSchedule();
  if (tab === 'update') loadTags();
  if (tab !== 'backup' && typeof resetImportBox === 'function' && !$('bi-box').hidden) { window.devoirsAPI.cancelBackup(); resetImportBox(); }
  document.querySelectorAll('#setNav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.set-body section').forEach((s) => { s.hidden = s.dataset.panel !== tab; });
}

function openSettings(tab) {
  showTab(tab || 'appearance');
  colorEditing = null;
  newSubjectColor = nextFreeColor();
  $('s-new-name').value = '';
  $('s-new-err').textContent = '';
  renderSubjectManager();
  renderNewSubjectPalette();
  $('s-start').value = state.settings.startFilter;
  $('s-prio').value = String(state.settings.defaultPriority);
  $('s-confirm').checked = !!state.settings.confirmDelete;
  $('u-repo').value = state.settings.updateRepo || DEFAULT_UPDATE_REPO;
  fillNotifSettings();
  window.devoirsAPI.getVersion().then((v) => { $('u-version').textContent = `Mes Devoirs ${v}`; }).catch(() => {});
  if (!$('settings').open) $('settings').showModal();
}

function renderSubjectManager() {
  renderSchedule();
  const box = $('s-subjects');
  box.textContent = '';
  const subjects = state.settings.subjects;

  if (subjects.length === 0) {
    box.append(el('div', 'empty-rows', 'Aucune matière. Ajoutes-en une ci-dessous.'));
    return;
  }

  subjects.forEach((s) => {
    const row = el('div', 'srow');
    const sw = button('swatch big');
    sw.style.setProperty('--c', s.color);
    sw.title = 'Changer la couleur';
    sw.setAttribute('aria-label', `Changer la couleur de ${s.name}`);
    sw.addEventListener('click', () => {
      colorEditing = colorEditing === s.id ? null : s.id;
      renderSubjectManager();
    });

    const n = countUsing(s.name);
    const del = button('del');
    del.append(mkIcon('trash'));
    del.title = 'Retirer cette matière';
    del.setAttribute('aria-label', `Retirer ${s.name}`);
    del.addEventListener('click', () => {
      if (removeSubject(s)) { colorEditing = null; renderSubjectManager(); render(); }
    });

    row.append(sw, el('span', 'sname', s.name), el('span', 'scount', n > 0 ? `${n} devoir${n > 1 ? 's' : ''}` : ''), del);
    box.append(row);

    if (colorEditing === s.id) {
      const prow = el('div', 'prow');
      const pal = el('div', 'palette');
      renderPalette(pal, s.color, (c) => {
        setSubjectColor(s, c);
        colorEditing = null;
        renderSubjectManager();
        render();
      });
      prow.append(pal);
      box.append(prow);
    }
  });
}

function renderSchedule() {
  const box = $('s-schedule');
  box.textContent = '';
  const subjects = state.settings.subjects;
  if (subjects.length === 0) {
    box.append(el('div', 'empty-rows', "Aucune matière. Ajoutes-en dans l'onglet Matières."));
    return;
  }
  const head = el('div', 'sched-row sched-head');
  head.append(el('span', 'sched-name'));
  DAY_SHORT.forEach((d) => head.append(el('span', 'sched-day', d)));
  box.append(head);
  subjects.forEach((s) => {
    const row = el('div', 'sched-row');
    const name = el('span', 'sched-name');
    name.style.setProperty('--c', s.color);
    name.append(el('span', 'dot'), s.name);
    row.append(name);
    DAY_SHORT.forEach((d, i) => {
      const on = (s.days || []).includes(i + 1);
      const b = button('sched-cell' + (on ? ' on' : ''));
      b.style.setProperty('--c', s.color);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${s.name}, ${DAY_NAMES[i]}`);
      if (on) b.append(mkIcon('check'));
      b.addEventListener('click', () => {
        const days = new Set(s.days || []);
        if (days.has(i + 1)) days.delete(i + 1); else days.add(i + 1);
        s.days = [...days].sort();
        persist();
        renderSchedule();
      });
      row.append(b);
    });
    box.append(row);
  });
}

function renderNewSubjectPalette() {
  renderPalette($('s-new-palette'), newSubjectColor, (c) => { newSubjectColor = c; renderNewSubjectPalette(); });
}

function submitNewSubject() {
  const r = addSubject($('s-new-name').value, newSubjectColor);
  if (!r.ok) { $('s-new-err').textContent = r.msg; return; }
  $('s-new-name').value = '';
  $('s-new-err').textContent = '';
  newSubjectColor = nextFreeColor();
  renderSubjectManager();
  renderNewSubjectPalette();
  render();
  $('s-new-name').focus();
}

$('s-new-add').addEventListener('click', submitNewSubject);
$('s-new-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submitNewSubject(); } });
$('s-new-name').addEventListener('input', () => { $('s-new-err').textContent = ''; });

$('s-restore').addEventListener('click', () => {
  const missing = DEFAULT_SUBJECTS.filter((d) => !findSubject(d.name));
  if (missing.length === 0) { alert('Toutes les matières par défaut sont déjà dans la liste.'); return; }
  missing.forEach((d) => state.settings.subjects.push({ id: uid(), name: d.name, color: d.color }));
  persist();
  renderSubjectManager();
  render();
});

$('setNav').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (b) showTab(b.dataset.tab);
});

$('themeSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-theme]');
  if (!b) return;
  state.settings.theme = b.dataset.theme;
  persist();
  applyTheme();
});

$('s-start').addEventListener('change', (e) => { state.settings.startFilter = e.target.value; persist(); });
$('s-prio').addEventListener('change', (e) => { state.settings.defaultPriority = e.target.value; persist(); });
$('s-confirm').addEventListener('change', (e) => { state.settings.confirmDelete = e.target.checked; persist(); });

// ----- Notifications -----
function fillNotifSettings() {
  const n = state.settings.notifications;
  $('n-enabled').checked = n.enabled;
  $('n-time').value = n.time;
  $('n-days').value = String(n.daysAhead);
  $('n-late').checked = n.includeLate;
  $('n-bg').checked = n.background;
  $('n-startup').checked = n.startup;
  $('n-startup').disabled = !n.background;
  $('n-time').disabled = $('n-days').disabled = $('n-late').disabled = !n.enabled;
  $('n-due').checked = n.dueReminder;
  $('n-due-time').value = n.dueTime;
  $('n-due-time').disabled = !n.dueReminder;
  $('n-morning').checked = n.morning;
  $('n-morning-time').value = n.morningTime;
  $('n-morning-time').disabled = !n.morning;
  $('n-actions').checked = n.actions;
  $('n-sound').value = n.sound;
  $('n-vac').checked = n.vacation;
  $('n-vac-from').value = n.vacationFrom;
  $('n-vac-to').value = n.vacationTo;
  $('n-vac-from').disabled = $('n-vac-to').disabled = !n.vacation;
  $('n-vac-msg').textContent = n.vacation && n.vacationFrom && n.vacationTo && n.vacationTo < n.vacationFrom
    ? 'La fin doit être après le début : le mode vacances est inactif.'
    : 'Dernier jour sans rappel.';
  $('n-test-msg').textContent = 'Envoie une notification pour vérifier que tout marche.';
}

function setNotif(key, value) {
  state.settings.notifications[key] = value;
  persist();
  fillNotifSettings();
}

$('n-enabled').addEventListener('change', (e) => setNotif('enabled', e.target.checked));
$('n-time').addEventListener('change', (e) => { if (/^\d{2}:\d{2}$/.test(e.target.value)) setNotif('time', e.target.value); else fillNotifSettings(); });
$('n-days').addEventListener('change', (e) => setNotif('daysAhead', Number(e.target.value)));
$('n-late').addEventListener('change', (e) => setNotif('includeLate', e.target.checked));
$('n-bg').addEventListener('change', (e) => {
  state.settings.notifications.background = e.target.checked;
  if (!e.target.checked) state.settings.notifications.startup = false;
  persist();
  fillNotifSettings();
});
$('n-startup').addEventListener('change', (e) => setNotif('startup', e.target.checked));
$('n-due').addEventListener('change', (e) => setNotif('dueReminder', e.target.checked));
$('n-due-time').addEventListener('change', (e) => { if (/^\d{2}:\d{2}$/.test(e.target.value)) setNotif('dueTime', e.target.value); else fillNotifSettings(); });
$('n-morning').addEventListener('change', (e) => setNotif('morning', e.target.checked));
$('n-morning-time').addEventListener('change', (e) => { if (/^\d{2}:\d{2}$/.test(e.target.value)) setNotif('morningTime', e.target.value); else fillNotifSettings(); });
$('n-actions').addEventListener('change', (e) => setNotif('actions', e.target.checked));
$('n-sound').addEventListener('change', (e) => setNotif('sound', e.target.value));
$('n-vac').addEventListener('change', (e) => setNotif('vacation', e.target.checked));
$('n-vac-from').addEventListener('change', (e) => setNotif('vacationFrom', e.target.value));
$('n-vac-to').addEventListener('change', (e) => setNotif('vacationTo', e.target.value));

$('n-test').addEventListener('click', async () => {
  const msg = $('n-test-msg');
  // on laisse le temps à la sauvegarde des réglages d'arriver avant le test
  await new Promise((r) => setTimeout(r, 250));
  let r;
  try { r = await window.devoirsAPI.testNotification(); } catch (e) { r = { ok: false }; }
  msg.textContent = r && r.ok
    ? 'Notification envoyée. Rien reçu ? Vérifie que les notifications de Windows ne sont pas coupées (mode « Ne pas déranger » ou assistant de concentration).'
    : "Impossible d'envoyer la notification sur cet ordinateur.";
});

// Un bouton de notification (« Marquer fait ») a modifié les devoirs pendant que la fenêtre était ouverte
// Les devoirs qui se répètent, terminés depuis la notification, donnent leur prochain devoir ici.
function applyPendingSpawns() {
  let spawned = 0;
  state.homework.slice().forEach((h) => {
    if (!h.pendingSpawn) return;
    delete h.pendingSpawn;
    if (h.done && h.repeat && h.date && !(h.spawned && state.homework.some((x) => x.id === h.spawned))) {
      const n = cloneForRepeat(h, nextOccurrence(h));
      state.homework.push(n);
      h.spawned = n.id;
      spawned++;
    }
  });
  return spawned;
}
window.devoirsAPI.onDataChanged((homework) => {
  if (!Array.isArray(homework)) return;
  state.homework = homework;
  if (applyPendingSpawns()) persist();
  render();
});

// Clic sur une notification : on ouvre la bonne liste
// (si la fenêtre vient d'être recréée, on attend la fin du chargement des données)
let appReady = false;
let pendingOpenFilter = null;
function openFromNotification(filter) {
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  if (FILTER_LABELS[filter]) state.filter = filter;
  state.subject = null;
  state.search = '';
  $('search').value = '';
  state.view = 'list';
  render();
}
window.devoirsAPI.onNotificationOpen((filter) => {
  if (!appReady) { pendingOpenFilter = filter; return; }
  openFromNotification(filter);
});

// ----- Sauvegarde : export / import -----
const BACKUP_ERRORS = {
  json: "Ce fichier n'est pas une sauvegarde valide.",
  format: "Ce fichier n'est pas une sauvegarde valide.",
  'other-app': "Ce fichier vient d'une autre application.",
  'too-new': "Ce fichier vient d'une version plus récente de Mes Devoirs. Mets l'application à jour d'abord.",
  empty: "Ce fichier ne contient rien à importer.",
  size: 'Ce fichier est trop gros pour être une sauvegarde.',
  read: 'Impossible de lire ce fichier.',
  write: "Impossible d'écrire le fichier à cet endroit.",
  none: "Choisis d'abord un fichier à importer.",
  apply: "L'import a échoué. Tes données n'ont pas été modifiées.",
};
const pl = (n, one, many) => `${n} ${n > 1 ? many : one}`;
let importMode = 'merge';
let importCounts = null;

function resetImportBox() {
  $('bi-box').hidden = true;
  $('bi-pick-row').hidden = false;
  $('bi-err').textContent = '';
  importCounts = null;
}

function updateImportHint() {
  document.querySelectorAll('#bi-mode button').forEach((b) => {
    const on = b.dataset.mode === importMode;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });
  $('bi-mode-hint').textContent = importMode === 'merge'
    ? "Ajoute les devoirs et matières qui te manquent. Rien de ce que tu as déjà n'est supprimé ni modifié."
    : 'Remplace tes devoirs et matières par ceux du fichier. Une copie de tes données actuelles est gardée au cas où.';
  const any = ['homework', 'subjects', 'settings'].some((k) => !$(`bi-row-${k}`).hidden && $(`bi-${k}`).checked);
  $('bi-apply').disabled = !any;
}

// Remet l'interface d'accord avec les données (après un import)
function refreshAfterImport() {
  state.sort = SORT_VALUES.includes(state.settings.sort) ? state.settings.sort : 'date';
  state.view = state.settings.view === 'calendar' ? 'calendar' : 'list';
  state.calMode = state.settings.calMode === 'week' ? 'week' : 'month';
  if (state.subject !== null && !findSubject(state.subject)) state.subject = null;
  $('sort').value = state.sort;
  $('s-start').value = state.settings.startFilter;
  $('s-prio').value = String(state.settings.defaultPriority);
  $('s-confirm').checked = !!state.settings.confirmDelete;
  fillNotifSettings();
  applyTheme();
  renderSubjectManager();
  render();
}
const SORT_VALUES = ['date', 'priority', 'subject', 'created', 'custom'];

$('bx-go').addEventListener('click', async () => {
  const parts = { homework: $('bx-homework').checked, subjects: $('bx-subjects').checked, settings: $('bx-settings').checked };
  const msg = $('bx-msg');
  if (!parts.homework && !parts.subjects && !parts.settings) { msg.textContent = 'Choisis au moins une partie à exporter.'; return; }
  $('bx-go').disabled = true;
  let r;
  try { r = await window.devoirsAPI.exportBackup({ homework: state.homework, settings: state.settings }, parts); } catch (e) { r = { ok: false, reason: 'write' }; }
  $('bx-go').disabled = false;
  if (r && r.ok) {
    const bits = [];
    if (r.homework !== null) bits.push(pl(r.homework, 'devoir', 'devoirs'));
    if (r.subjects !== null) bits.push(pl(r.subjects, 'matière', 'matières'));
    msg.textContent = `Fichier « ${r.name} » enregistré${bits.length ? ` (${bits.join(', ')})` : ''}.`;
  } else if (r && r.canceled) {
    msg.textContent = "Tu choisis où l'enregistrer.";
  } else {
    msg.textContent = BACKUP_ERRORS[(r && r.reason) || 'write'];
  }
});

$('bi-pick').addEventListener('click', async () => {
  $('bi-err').textContent = '';
  $('bi-pick').disabled = true;
  let r;
  try { r = await window.devoirsAPI.pickBackup(); } catch (e) { r = { ok: false, reason: 'read' }; }
  $('bi-pick').disabled = false;
  if (!r || r.canceled) return;
  if (!r.ok) { $('bi-err').textContent = BACKUP_ERRORS[r.reason] || BACKUP_ERRORS.read; return; }

  importCounts = r.counts;
  importMode = 'merge';
  $('bi-title').textContent = r.name;
  $('bi-sub').textContent = r.exportedAt
    ? `Sauvegarde du ${new Date(r.exportedAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}`
    : 'Sauvegarde sans date';
  const c = r.counts;
  [['homework', c.homework, 'devoir', 'devoirs'], ['subjects', c.subjects, 'matière', 'matières']].forEach(([k, n, one, many]) => {
    $(`bi-row-${k}`).hidden = n === null;
    $(`bi-n-${k}`).textContent = n === null ? '' : `${pl(n, one, many)} dans le fichier.`;
    $(`bi-${k}`).checked = n !== null;
  });
  $('bi-row-settings').hidden = c.settings === null || c.settings === 0;
  $('bi-settings').checked = !$('bi-row-settings').hidden;
  $('bi-pick-row').hidden = true;
  $('bi-box').hidden = false;
  updateImportHint();
  $('bi-box').scrollIntoView({ block: 'nearest' });
});

$('bi-mode').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-mode]');
  if (!b) return;
  importMode = b.dataset.mode;
  updateImportHint();
});
['homework', 'subjects', 'settings'].forEach((k) => $(`bi-${k}`).addEventListener('change', updateImportHint));

$('bi-cancel').addEventListener('click', () => {
  window.devoirsAPI.cancelBackup();
  resetImportBox();
});

$('bi-apply').addEventListener('click', async () => {
  const options = {
    mode: importMode,
    homework: !$('bi-row-homework').hidden && $('bi-homework').checked,
    subjects: !$('bi-row-subjects').hidden && $('bi-subjects').checked,
    settings: !$('bi-row-settings').hidden && $('bi-settings').checked,
  };
  if (importMode === 'replace' && (options.homework || options.subjects)) {
    const what = [options.homework && 'tes devoirs', options.subjects && 'tes matières'].filter(Boolean).join(' et ');
    if (!confirm(`Remplacer ${what} actuels par ceux du fichier ?\n\nUne copie de tes données actuelles est gardée au cas où.`)) return;
  }
  $('bi-apply').disabled = true;
  let r;
  try { r = await window.devoirsAPI.applyBackup({ homework: state.homework, settings: state.settings }, options); } catch (e) { r = { ok: false, reason: 'apply' }; }
  if (!r || !r.ok) {
    $('bi-err').textContent = BACKUP_ERRORS[(r && r.reason) || 'apply'];
    $('bi-apply').disabled = false;
    return;
  }

  state.homework = r.state.homework;
  state.settings = Object.assign(state.settings, r.state.settings);
  state.settings.defaultPriority = String(state.settings.defaultPriority);
  clearTimeout(saveTimer);
  saveNow();
  refreshAfterImport();

  const rep = r.report;
  const bits = [];
  if (options.homework) bits.push(rep.replaced ? pl(rep.homeworkAdded, 'devoir importé', 'devoirs importés')
    : `${pl(rep.homeworkAdded, 'devoir ajouté', 'devoirs ajoutés')}${rep.homeworkSkipped ? ` (${pl(rep.homeworkSkipped, 'déjà présent', 'déjà présents')})` : ''}`);
  if (options.subjects) bits.push(rep.replaced ? pl(rep.subjectsAdded, 'matière importée', 'matières importées') : pl(rep.subjectsAdded, 'matière ajoutée', 'matières ajoutées'));
  if (rep.settingsApplied) bits.push('réglages appliqués');
  resetImportBox();
  $('bi-msg').textContent = `Import terminé : ${bits.join(', ')}.`;
});

// ----- Mise à jour -----
let updateUrl = null;

// Nettoie un peu le texte Markdown d'une release GitHub pour l'afficher simplement (sans HTML)
function cleanNote(t) {
  return String(t)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/pull\/(\d+)/g, '#$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^>\s?/, '')
    .trim();
}

function renderNotes(text, version) {
  const out = $('u-notes-body');
  out.textContent = '';
  $('u-notes-title').textContent = `Nouveautés de la version ${version}`;
  let list = null;
  let any = false;
  String(text || '').replace(/\r/g, '').split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line || /^<!--/.test(line) || /^\**full changelog/i.test(line)) { list = null; return; }
    const head = /^#{1,6}\s+(.*)$/.exec(line);
    const item = /^[-*+]\s+(.*)$/.exec(line) || /^\d+[.)]\s+(.*)$/.exec(line);
    const txt = cleanNote(head ? head[1] : item ? item[1] : line);
    if (!txt) return;
    any = true;
    if (head) { list = null; out.append(el('h5', null, txt)); }
    else if (item) { if (!list) { list = el('ul'); out.append(list); } list.append(el('li', null, txt)); }
    else { list = null; out.append(el('p', null, txt)); }
  });
  if (!any) out.append(el('p', 'muted', "Aucune description n'a été publiée pour cette version."));
  $('u-notes').hidden = false;
  $('u-notes').scrollTop = 0;
}
let updateCanInstall = false; // un installeur adapté à ce PC existe : téléchargement et installation depuis l'appli
let installing = false;

function mo(bytes) {
  return `${(bytes / 1048576).toFixed(1).replace('.', ',')} Mo`;
}

// Affiche le bouton principal selon qu'on peut installer directement ou qu'il faut passer par la page GitHub
function setInstallButton(r) {
  updateCanInstall = !!r.asset;
  $('u-open').textContent = r.asset ? `Télécharger et installer la ${r.latest}` : `Télécharger la ${r.latest}`;
  if (r.asset) {
    $('u-sub').textContent = `${r.asset.name}${r.asset.size ? ` (${mo(r.asset.size)})` : ''} · adapté à ton ordinateur. L'installateur s'ouvrira à la fin du téléchargement.`;
  } else {
    $('u-sub').textContent = "Aucun installeur pour ton type d'ordinateur dans cette version : la page de téléchargement va s'ouvrir.";
  }
}

const INSTALL_ERRORS = {
  network: 'Le téléchargement a échoué. Vérifie ta connexion Internet puis réessaie.',
  size: 'Le fichier téléchargé est incomplet. Réessaie.',
  hash: 'Le fichier téléchargé est corrompu (empreinte incorrecte). Réessaie.',
  disk: "Impossible d'enregistrer le fichier sur le disque.",
  launch: "Le fichier est téléchargé mais l'installateur ne s'est pas ouvert.",
  busy: 'Un téléchargement est déjà en cours.',
  'no-asset': 'Aucun installeur trouvé pour ton ordinateur.',
};

async function installUpdate() {
  if (installing) return;
  installing = true;
  const bar = $('u-progress');
  $('u-open').disabled = $('u-check').disabled = $('u-tag').disabled = true;
  $('u-title').textContent = 'Téléchargement en cours…';
  $('u-sub').textContent = 'Préparation…';
  bar.value = 0;
  bar.hidden = false;

  let r;
  try { r = await window.devoirsAPI.downloadUpdate(); } catch (e) { r = { ok: false, reason: 'network' }; }
  installing = false;
  bar.hidden = true;

  if (r && r.ok) {
    showUpdateStatus('ok', 'check', "L'installateur est ouvert", "Mes Devoirs va se fermer pour laisser l'installation se faire. Suis les étapes de l'installateur.");
    $('u-open').disabled = true;
    return;
  }
  $('u-open').disabled = $('u-check').disabled = $('u-tag').disabled = false;
  showUpdateStatus('bad', 'alert', 'Installation impossible', INSTALL_ERRORS[r && r.reason] || 'Une erreur est survenue. Réessaie.', updateUrl);
  // On propose la page de téléchargement en secours
  updateCanInstall = false;
  $('u-open').hidden = false;
  $('u-open').textContent = 'Ouvrir la page de téléchargement';
}

window.devoirsAPI.onUpdateProgress(({ received, total }) => {
  const bar = $('u-progress');
  if (total > 0) {
    const pct = Math.min(100, Math.round((received / total) * 100));
    bar.value = pct;
    $('u-sub').textContent = `${pct} % · ${mo(received)} sur ${mo(total)}`;
  } else {
    bar.removeAttribute('value');
    $('u-sub').textContent = mo(received);
  }
});

function showUpdateStatus(kind, icon, title, sub, url) {
  const box = $('u-status');
  box.hidden = false;
  box.className = 'u-status ' + kind;
  setIcon($('u-icon'), icon);
  $('u-title').textContent = title;
  $('u-sub').textContent = sub || '';
  updateUrl = url || null;
  $('u-notes').hidden = true;
  updateCanInstall = false;
  $('u-progress').hidden = true;
  $('u-open').hidden = !url;
}

async function runUpdateCheck() {
  const btn = $('u-check');
  btn.disabled = true;
  $('u-open').disabled = false;
  showUpdateStatus('', 'clock', 'Recherche en cours…', '');
  const repo = $('u-repo').value.trim();
  state.settings.updateRepo = repo;
  persist();
  let r;
  try { r = await window.devoirsAPI.checkUpdate(repo, $('u-tag').value); } catch (e) { r = { status: 'error' }; }
  btn.disabled = false;

  switch (r.status) {
    case 'available':
      showUpdateStatus('new', 'download', `La version ${r.latest} est disponible`, 'Télécharge-la puis installe-la par-dessus la version actuelle.', r.url);
      setInstallButton(r);
      renderNotes(r.notes, r.latest);
      break;
    case 'older':
      showUpdateStatus('new', 'download', `La version ${r.latest} est plus ancienne que la tienne`, 'Tu peux quand même la télécharger pour revenir en arrière.', r.url);
      setInstallButton(r);
      renderNotes(r.notes, r.latest);
      break;
    case 'up-to-date':
      showUpdateStatus('ok', 'check', $('u-tag').value ? `Tu as déjà la version ${r.latest}` : 'Tu as la dernière version', `Version ${r.latest}`);
      break;
    case 'no-repo':
      showUpdateStatus('bad', 'alert', 'Dépôt GitHub manquant', 'Écris le nom de ton dépôt (ex : pseudo/mes-devoirs) ci-dessous.');
      $('u-repo').focus();
      break;
    case 'no-release':
      showUpdateStatus('bad', 'alert', 'Aucune version trouvée', $('u-tag').value ? 'Ce tag n\'existe pas (ou plus) dans les « Releases » du dépôt.' : 'Vérifie le nom du dépôt, ou publie une version dans « Releases » sur GitHub.');
      break;
    case 'network':
      showUpdateStatus('bad', 'alert', 'Impossible de vérifier', 'Vérifie ta connexion Internet puis réessaie.');
      break;
    default:
      showUpdateStatus('bad', 'alert', 'La vérification a échoué', 'Réessaie dans quelques instants.');
  }
}

// Remplit la liste des tags depuis GitHub (en cas d'échec, il reste « Dernière version »)
async function loadTags() {
  const sel = $('u-tag');
  const wanted = state.settings.updateTag || '';
  const repo = $('u-repo').value.trim() || state.settings.updateRepo || DEFAULT_UPDATE_REPO;
  let r;
  try { r = await window.devoirsAPI.listReleases(repo); } catch (e) { r = { status: 'error' }; }
  const tags = r && r.status === 'ok' ? r.releases : [];
  sel.textContent = '';
  const last = document.createElement('option');
  last.value = '';
  last.textContent = 'Dernière version';
  sel.append(last);
  // le tag déjà choisi reste proposé même si la liste n'a pas pu être chargée
  const list = tags.map((t) => t.tag);
  if (wanted && !list.includes(wanted)) list.push(wanted);
  list.forEach((tag) => {
    const o = document.createElement('option');
    o.value = tag;
    const pre = tags.find((t) => t.tag === tag);
    o.textContent = tag + (pre && pre.prerelease ? ' (préversion)' : '');
    sel.append(o);
  });
  sel.value = wanted;
}

$('u-tag').addEventListener('change', (e) => { state.settings.updateTag = e.target.value; persist(); });
$('u-repo').addEventListener('change', () => loadTags());

$('u-check').addEventListener('click', runUpdateCheck);
$('u-open').addEventListener('click', () => {
  if (updateCanInstall) installUpdate();
  else if (updateUrl) window.devoirsAPI.openUpdatePage(updateUrl);
});
$('u-repo').addEventListener('keydown', (e) => { if (e.key === 'Enter') runUpdateCheck(); });
$('u-repo').addEventListener('change', (e) => { state.settings.updateRepo = e.target.value.trim(); persist(); });

$('setClose').addEventListener('click', () => $('settings').close());
$('settings').addEventListener('close', () => {
  render();
  if ($('dialog').open) renderPicker();
});

$('settingsBtn').addEventListener('click', () => openSettings('appearance'));
$('manageSubjects').addEventListener('click', () => openSettings('subjects'));

// ---------- Événements ----------
$('newBtn').addEventListener('click', () => openDialog(null));

$('viewSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-view]');
  if (!b) return;
  state.view = b.dataset.view;
  state.settings.view = state.view;
  persist();
  renderView();
});

function moveCal(delta) {
  const a = state.calAnchor;
  state.calAnchor = state.calMode === 'week'
    ? new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7 * delta)
    : new Date(a.getFullYear(), a.getMonth() + delta, 1);
  renderCalendar();
}
$('calPrev').addEventListener('click', () => moveCal(-1));
$('calNext').addEventListener('click', () => moveCal(1));
$('calToday').addEventListener('click', () => {
  state.calAnchor = new Date();
  renderCalendar();
});

$('calModeSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-mode]');
  if (!b || b.dataset.mode === state.calMode) return;
  // Si aujourd'hui est dans la période affichée, on s'y recentre
  const t = new Date();
  const a = state.calAnchor;
  const todayShown = state.calMode === 'month'
    ? a.getFullYear() === t.getFullYear() && a.getMonth() === t.getMonth()
    : ymd(mondayOf(a)) === ymd(mondayOf(t));
  if (todayShown) state.calAnchor = t;
  state.calMode = b.dataset.mode;
  state.settings.calMode = state.calMode;
  persist();
  renderCalendar();
});

$('filters').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-filter]');
  if (!b) return;
  state.filter = b.dataset.filter;
  render();
});

$('search').addEventListener('input', (e) => { state.search = e.target.value; renderView(); });

$('sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  state.settings.sort = state.sort;
  persist();
  renderView();
});

$('themeBtn').addEventListener('click', () => {
  state.settings.theme = resolvedTheme() === 'dark' ? 'light' : 'dark';
  persist();
  applyTheme();
});

$('clearDone').addEventListener('click', () => {
  const n = state.homework.filter((h) => h.done).length;
  if (n === 0) { alert('Aucun devoir terminé à supprimer.'); return; }
  if (confirm(`Supprimer les ${n} devoir${n > 1 ? 's' : ''} terminé${n > 1 ? 's' : ''} ?`)) {
    deleteItems(state.homework.filter((h) => h.done), `${n} devoir${n > 1 ? 's' : ''} supprimé${n > 1 ? 's' : ''}`);
  }
});

// ---------- Statistiques ----------
// Série : jours de suite (jusqu'à aujourd'hui) où aucun devoir n'était en retard
function lateStreak() {
  if (!state.homework.length) return null;
  const today = todayStr();
  let start = today;
  state.homework.forEach((h) => {
    if (h.created) { const c = ymd(new Date(h.created)); if (c < start) start = c; }
  });
  const floor = shiftDate(today, -400);
  if (start < floor) start = floor;
  const bad = new Set();
  state.homework.forEach((h) => {
    if (!h.date) return;
    let to = null;
    if (h.done) {
      if (h.doneAt) { const d = ymd(new Date(h.doneAt)); if (d > h.date) to = d; }
    } else if (h.date < today) {
      to = today;
    }
    if (!to) return;
    let d = shiftDate(h.date, 1);
    if (d < start) d = start;
    for (let i = 0; d <= to && i < 500; i++) { bad.add(d); d = shiftDate(d, 1); }
  });
  let streak = 0;
  for (let d = today, i = 0; d >= start && !bad.has(d) && i < 500; d = shiftDate(d, -1), i++) streak++;
  let best = 0;
  let run = 0;
  for (let d = start, i = 0; d <= today && i < 500; d = shiftDate(d, 1), i++) {
    if (bad.has(d)) run = 0; else { run++; if (run > best) best = run; }
  }
  return { streak, best, lateNow: state.homework.filter(isLate).length };
}

function onTimeStats() {
  const done = state.homework.filter((h) => h.done && h.date && h.doneAt);
  const by = new Map();
  let ok = 0;
  done.forEach((h) => {
    const good = ymd(new Date(h.doneAt)) <= h.date;
    if (good) ok++;
    const name = (h.subject || '').trim();
    const k = name.toLowerCase();
    if (!by.has(k)) by.set(k, { name, total: 0, ok: 0 });
    const r = by.get(k);
    r.total++;
    if (good) r.ok++;
  });
  return { total: done.length, ok, rows: [...by.values()].sort((a, b) => b.total - a.total) };
}

function weekStats(n) {
  const today = todayStr();
  const mon = mondayOf(new Date());
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = ymd(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() - 7 * i));
    const end = shiftDate(start, 6);
    const w = { start, ok: 0, late: 0, missed: 0, todo: 0 };
    state.homework.forEach((h) => {
      if (!h.date || h.date < start || h.date > end) return;
      if (h.done) { if (h.doneAt && ymd(new Date(h.doneAt)) > h.date) w.late++; else w.ok++; }
      else if (h.date < today) w.missed++;
      else w.todo++;
    });
    w.total = w.ok + w.late + w.missed + w.todo;
    weeks.push(w);
  }
  return weeks;
}

// Moyennes sur 20, pondérées par les coefficients, par matière
function gradeStats() {
  const by = new Map();
  state.homework.forEach((h) => {
    if (typeof h.grade !== 'number') return;
    const max = h.gradeMax > 0 ? h.gradeMax : 20;
    const coef = h.coef > 0 ? h.coef : 1;
    const name = (h.subject || '').trim();
    const k = name.toLowerCase();
    if (!by.has(k)) by.set(k, { name, sum: 0, coef: 0, n: 0 });
    const r = by.get(k);
    r.sum += (h.grade / max) * 20 * coef;
    r.coef += coef;
    r.n++;
  });
  const rows = [...by.values()].map((r) => ({ name: r.name, n: r.n, avg: r.sum / r.coef })).sort((a, b) => b.avg - a.avg);
  const general = rows.length ? rows.reduce((sum, r) => sum + r.avg, 0) / rows.length : null;
  return { rows, general };
}

function pbar(ratio, cls) {
  const track = el('div', 'pbar');
  const fill = el('span', 'pfill ' + cls);
  fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  track.append(fill);
  return track;
}

function statRow(name, ratio, cls, value) {
  const row = el('div', 'st-row');
  const label = el('span', 'st-name');
  label.style.setProperty('--c', subjectColor(name));
  label.append(el('span', 'dot'), name || 'Sans matière');
  row.append(label, pbar(ratio, cls), el('span', 'st-val', value));
  return row;
}

function statSection(title) {
  const sec = el('section', 'st-sec');
  sec.append(el('h3', null, title));
  return sec;
}

function renderStats() {
  const box = $('statsBody');
  box.textContent = '';

  // Série sans retard
  const st = lateStreak();
  const card = el('div', 'streak' + (st && st.streak > 0 ? '' : ' off'));
  const num = el('div', 'streak-n');
  const txt = el('div', 'streak-t');
  if (!st) {
    num.textContent = '—';
    txt.append(el('strong', null, 'Série sans retard'), el('span', null, 'Ajoute des devoirs pour lancer ta série.'));
  } else {
    num.append(el('span', 'flame', st.streak > 0 ? '🔥' : '⏸'), String(st.streak));
    txt.append(el('strong', null, st.streak > 0
      ? `jour${st.streak > 1 ? 's' : ''} de suite sans devoir en retard`
      : 'Série en pause'));
    const sub = [];
    if (st.lateNow > 0) sub.push(`${st.lateNow} devoir${st.lateNow > 1 ? 's' : ''} en retard : termine-${st.lateNow > 1 ? 'les' : 'le'} pour relancer la série.`);
    sub.push(`Record : ${st.best} jour${st.best > 1 ? 's' : ''}`);
    txt.append(el('span', null, sub.join(' ')));
  }
  card.append(num, txt);
  box.append(card);

  // Rendus à temps
  const ot = onTimeStats();
  const s1 = statSection('Rendus à temps');
  if (!ot.total) {
    s1.append(el('p', 'muted', 'Les statistiques apparaîtront quand tu auras terminé des devoirs qui ont une date.'));
  } else {
    const big = el('div', 'st-big');
    big.append(el('strong', null, `${Math.round((ot.ok / ot.total) * 100)} %`), el('span', 'muted', `${ot.ok} sur ${ot.total} devoirs terminés à temps`));
    s1.append(big, pbar(ot.ok / ot.total, 'ok'));
    if (ot.rows.length > 1 || (ot.rows[0] && ot.rows[0].name)) {
      const rows = el('div', 'st-rows');
      ot.rows.forEach((r) => rows.append(statRow(r.name, r.ok / r.total, 'ok', `${Math.round((r.ok / r.total) * 100)} % · ${r.ok}/${r.total}`)));
      s1.append(rows);
    }
  }
  box.append(s1);

  // Moyennes
  const gs = gradeStats();
  const s2 = statSection('Notes et moyennes');
  if (!gs.rows.length) {
    s2.append(el('p', 'muted', 'Choisis le type « Contrôle » ou « Exposé » dans un devoir, puis renseigne la note obtenue : les moyennes par matière s\'affichent ici.'));
  } else {
    const big = el('div', 'st-big');
    big.append(el('strong', null, `${fmtNum(gs.general)}/20`), el('span', 'muted', 'moyenne générale (chaque matière compte autant)'));
    s2.append(big);
    const rows = el('div', 'st-rows');
    gs.rows.forEach((r) => rows.append(statRow(r.name, r.avg / 20, 'avg', `${fmtNum(r.avg)}/20 · ${r.n} note${r.n > 1 ? 's' : ''}`)));
    s2.append(rows);
  }
  box.append(s2);

  // 8 dernières semaines
  const weeks = weekStats(8);
  const maxTotal = Math.max(1, ...weeks.map((w) => w.total));
  const s3 = statSection('8 dernières semaines');
  const rows = el('div', 'st-rows');
  weeks.forEach((w) => {
    const row = el('div', 'st-row');
    const label = parseDate(w.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    row.append(el('span', 'st-name plain', `Sem. du ${label}`));
    const track = el('div', 'pbar wk');
    const stack = el('div', 'wstack');
    stack.style.width = `${(w.total / maxTotal) * 100}%`;
    [['ok', w.ok], ['late', w.late], ['missed', w.missed], ['todo', w.todo]].forEach(([cls, n]) => {
      if (!n) return;
      const seg = el('span', 'pfill ' + cls);
      seg.style.flexGrow = String(n);
      stack.append(seg);
    });
    track.append(stack);
    row.append(track, el('span', 'st-val', w.total ? String(w.total) : '—'));
    row.title = `${w.total} devoir${w.total > 1 ? 's' : ''} : ${w.ok} à temps, ${w.late} rendu${w.late > 1 ? 's' : ''} en retard, ${w.missed} non rendu${w.missed > 1 ? 's' : ''}, ${w.todo} à venir`;
    rows.append(row);
  });
  s3.append(rows);
  const legend = el('div', 'legend');
  [['ok', 'À temps'], ['late', 'Rendu en retard'], ['missed', 'Non rendu'], ['todo', 'À venir']].forEach(([cls, text]) => {
    const l = el('span');
    l.append(el('i', 'pfill ' + cls), text);
    legend.append(l);
  });
  s3.append(legend);
  box.append(s3);
}

function openStats() {
  renderStats();
  if (!$('statsDialog').open) $('statsDialog').showModal();
}
$('statsBtn').addEventListener('click', openStats);
$('stClose').addEventListener('click', () => $('statsDialog').close());
$('stOk').addEventListener('click', () => $('statsDialog').close());

// ---------- Imprimer / PDF ----------
let printRange = 'week';

function printData() {
  const mon = ymd(mondayOf(new Date()));
  const incDone = $('p-done').checked;
  let from = null;
  let to = null;
  let title = 'Devoirs à faire';
  if (printRange === 'week') { from = mon; to = shiftDate(mon, 6); title = 'Devoirs de la semaine'; }
  if (printRange === 'next') { from = shiftDate(mon, 7); to = shiftDate(mon, 13); title = 'Devoirs de la semaine prochaine'; }
  const rank = (h) => (!h.date ? 2 : (from && h.date < from ? 0 : 1));
  const items = state.homework.filter((h) => {
    if (printRange === 'todo') return !h.done;
    if (h.done && !incDone) return false;
    if (!h.date) return false;
    if (h.date >= from && h.date <= to) return true;
    return printRange === 'week' && !h.done && h.date < from; // devoirs en retard
  }).sort((a, b) => (rank(a) - rank(b)) || (a.date || '').localeCompare(b.date || '') || ((b.priority || 1) - (a.priority || 1)) || a.title.localeCompare(b.title, 'fr'));
  return { items, from, to, title, mon, rank };
}

function longDate(str, withYear) {
  return parseDate(str).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) });
}

function buildPrintSheet() {
  const sheet = $('printSheet');
  sheet.textContent = '';
  const { items, from, to, title, rank } = printData();
  sheet.append(el('h1', null, title));
  const period = from
    ? `Du ${longDate(from)} au ${longDate(to, true)}`
    : `Au ${longDate(todayStr(), true)}`;
  sheet.append(el('p', 'ps-sub', period));

  let lastKey = null;
  let ul = null;
  items.forEach((h) => {
    const r = rank(h);
    const key = r === 0 ? 'late' : r === 2 ? 'none' : h.date;
    if (key !== lastKey) {
      lastKey = key;
      sheet.append(el('h2', 'ps-day' + (r === 0 ? ' late' : ''), r === 0 ? 'En retard' : r === 2 ? 'Sans date' : longDate(h.date).replace(/^./, (c) => c.toUpperCase())));
      ul = el('ul', 'ps-list');
      sheet.append(ul);
      if (r === 1) {
        const classes = classesOn(h.date);
        if (classes.length) sheet.lastChild.before(el('p', 'ps-classes', 'Cours : ' + classes.join(', ')));
      }
    }
    const li = el('li', 'ps-item');
    li.append(el('span', 'ps-box', h.done ? '✓' : ''));
    const main = el('div', 'ps-main');
    const line = el('div', 'ps-line');
    if (h.subject) {
      const sub = el('span', 'ps-subject', h.subject);
      sub.style.setProperty('--c', subjectColor(h.subject));
      line.append(sub);
    }
    line.append(el('strong', null, h.title));
    const bits = [];
    if (KINDS[h.kind]) bits.push(`${KINDS[h.kind].emoji} ${KINDS[h.kind].label}`);
    if (h.minutes) bits.push(fmtMinutes(h.minutes));
    if (h.priority > 1) bits.push(PRIORITY_LABELS[h.priority]);
    if (typeof h.grade === 'number') bits.push(`Note ${fmtNum(h.grade)}/${fmtNum(h.gradeMax > 0 ? h.gradeMax : 20)}`);
    if (bits.length) line.append(el('span', 'ps-meta', bits.join(' · ')));
    main.append(line);
    if (h.notes) main.append(el('div', 'ps-notes', h.notes));
    if ((h.subtasks || []).length) {
      const subs = el('ul', 'ps-subs');
      h.subtasks.forEach((t) => {
        const sli = el('li');
        sli.append(el('span', 'ps-box small', t.done ? '✓' : ''), t.text);
        subs.append(sli);
      });
      main.append(subs);
    }
    li.append(main);
    ul.append(li);
  });
  if (!items.length) sheet.append(el('p', 'ps-empty', 'Aucun devoir pour cette période.'));

  const mins = items.reduce((sum, h) => sum + (h.done ? 0 : (h.minutes || 0)), 0);
  sheet.append(el('p', 'ps-foot', `${items.length} devoir${items.length > 1 ? 's' : ''}${mins ? ` · temps de travail estimé : ${fmtMinutes(mins)}` : ''} · Imprimé le ${longDate(todayStr(), true)} avec Mes Devoirs`));
  return items.length;
}

function updatePrintDialog() {
  document.querySelectorAll('#p-range button').forEach((b) => {
    const on = b.dataset.value === printRange;
    b.classList.toggle('on', on);
    b.setAttribute('aria-checked', String(on));
  });
  $('p-done').disabled = printRange === 'todo';
  const n = buildPrintSheet();
  $('p-count').textContent = n ? `${n} devoir${n > 1 ? 's' : ''} ${n > 1 ? 'seront imprimés' : 'sera imprimé'}.` : 'Aucun devoir pour cette période.';
  $('pPrint').disabled = n === 0;
  $('pPdf').disabled = n === 0;
}

function openPrint() {
  updatePrintDialog();
  if (!$('printDialog').open) $('printDialog').showModal();
}

$('printBtn').addEventListener('click', openPrint);
$('pClose').addEventListener('click', () => $('printDialog').close());
$('pCancel').addEventListener('click', () => $('printDialog').close());
$('p-range').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-value]');
  if (b) { printRange = b.dataset.value; updatePrintDialog(); }
});
$('p-done').addEventListener('change', updatePrintDialog);
$('pPrint').addEventListener('click', async () => {
  buildPrintSheet();
  const r = await window.devoirsAPI.printPage();
  if (r && !r.ok && !/cancel/i.test(r.reason || '')) showToast("L'impression n'a pas pu démarrer.");
});
$('pPdf').addEventListener('click', async () => {
  buildPrintSheet();
  const { mon } = printData();
  const name = printRange === 'todo' ? `MesDevoirs-a-faire-${todayStr()}.pdf` : `MesDevoirs-semaine-${printRange === 'next' ? shiftDate(mon, 7) : mon}.pdf`;
  const r = await window.devoirsAPI.savePdf(name);
  if (r && r.ok) showToast('PDF enregistré.');
  else if (!r || !r.canceled) showToast("Impossible d'enregistrer le PDF.");
});

// ---------- Raccourcis clavier ----------
const SHORTCUTS = [
  ['Liste', [
    ['↑|↓', 'Se déplacer dans la liste'],
    ['Espace', 'Cocher / décocher le devoir sélectionné'],
    ['Suppr', 'Supprimer le devoir sélectionné'],
  ]],
  ['Général', [
    ['Ctrl+N', 'Nouveau devoir'],
    ['Ctrl+K', 'Palette de commandes'],
    ['Ctrl+F|/', 'Rechercher'],
    ['Échap', 'Fermer la fenêtre ouverte, vider la recherche'],
    ['Ctrl+,', 'Paramètres'],
    ['Ctrl+P', 'Imprimer ou enregistrer en PDF'],
    ['Ctrl+I', 'Statistiques'],
    ['Ctrl+Maj+D', 'Changer de thème'],
    ['Ctrl+Z', 'Annuler la dernière suppression ou le dernier déplacement'],
    ['F1|?', 'Afficher cette aide'],
  ]],
  ['Navigation', [
    ['1 à 6', "Aujourd'hui · À faire · En retard · Cette semaine · Terminés · Tous"],
    ['L', 'Vue liste'],
    ['C', 'Vue calendrier'],
  ]],
  ['Calendrier', [
    ['←', 'Période précédente'],
    ['→', 'Période suivante'],
    ['T', "Revenir à aujourd'hui"],
    ['M', 'Affichage par mois'],
    ['S', 'Affichage par semaine'],
  ]],
  ["Formulaire d'un devoir", [
    ['Ctrl+Entrée', 'Enregistrer'],
  ]],
  ["Détail d'un devoir (calendrier)", [
    ['Espace', 'Cocher / décocher'],
    ['E', 'Modifier'],
    ['D', 'Dupliquer'],
  ]],
];

function openHelp() {
  const box = $('helpBody');
  if (!box.firstChild) {
    SHORTCUTS.forEach(([title, rows]) => {
      box.append(el('div', 'help-title', title));
      rows.forEach(([keys, label]) => {
        const row = el('div', 'help-row');
        const k = el('span', 'help-keys');
        keys.split('|').forEach((alt, i) => {
          if (i > 0) k.append(el('span', 'help-or', 'ou'));
          alt.split('+').forEach((key) => k.append(el('kbd', null, key)));
        });
        row.append(k, el('span', null, label));
        box.append(row);
      });
    });
  }
  $('helpDialog').showModal();
}
$('helpBtn').addEventListener('click', openHelp);
$('hClose').addEventListener('click', () => $('helpDialog').close());
$('hOk').addEventListener('click', () => $('helpDialog').close());

function isTyping(t) {
  if (!t || (t.closest && t.closest('dialog:not([open])'))) return false;
  if (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true;
  return t.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'color'].includes(t.type);
}

document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.isComposing || e.altKey) return; // Alt : aussi AltGr (Ctrl+Alt) des claviers AZERTY
  const mod = e.ctrlKey || e.metaKey;
  const key = (e.key || '').toLowerCase();
  const openDlg = document.querySelector('dialog[open]');

  if (mod && !e.shiftKey && key === 'k') { e.preventDefault(); togglePalette(); return; }

  // Une fenêtre est ouverte
  if (openDlg) {
    if (openDlg.id === 'dialog' && mod && e.key === 'Enter') { e.preventDefault(); $('form').requestSubmit(); }
    else if (openDlg.id === 'viewDialog' && !mod && !e.shiftKey && key === 'e' && !isTyping(e.target)) { e.preventDefault(); $('vEdit').click(); }
    else if (openDlg.id === 'viewDialog' && !mod && !e.shiftKey && key === 'd' && !isTyping(e.target)) { e.preventDefault(); $('vDup').click(); }
    return;
  }

  if (mod) {
    if (key === 'n' && !e.shiftKey) { e.preventDefault(); openDialog(null); }
    else if (key === 'f' && !e.shiftKey) { e.preventDefault(); $('search').focus(); $('search').select(); }
    else if (e.key === ',' || e.code === 'Comma') { e.preventDefault(); openSettings('appearance'); }
    else if (key === 'd' && e.shiftKey) { e.preventDefault(); $('themeBtn').click(); }
    else if (key === 'p' && !e.shiftKey) { e.preventDefault(); openPrint(); }
    else if (key === 'i' && !e.shiftKey) { e.preventDefault(); openStats(); }
    else if (key === 'z' && !e.shiftKey && !isTyping(e.target)) { if (undoLast()) e.preventDefault(); }
    return;
  }

  if (e.key === 'F1') { e.preventDefault(); openHelp(); return; }

  // Dans un champ de saisie : seule la touche Échap sert (vider la recherche)
  if (isTyping(e.target)) {
    if (e.key === 'Escape' && e.target === $('search')) {
      if ($('search').value) { $('search').value = ''; $('search').dispatchEvent(new Event('input')); } else { $('search').blur(); }
    }
    return;
  }

  if (e.key === '?') { e.preventDefault(); openHelp(); return; }
  if (e.key === '/') { e.preventDefault(); $('search').focus(); return; }

  // Chiffres : on lit la touche physique (sur un clavier AZERTY, « 1 » sans Maj donne « & »)
  const digit = /^(?:Digit|Numpad)([1-6])$/.exec(e.code || '');
  if (digit && !e.shiftKey) {
    e.preventDefault();
    const f = ['today', 'todo', 'late', 'week', 'done', 'all'][Number(digit[1]) - 1];
    document.querySelector(`#filters button[data-filter="${f}"]`).click();
    return;
  }
  if (e.shiftKey) return;

  if (e.key === 'Escape' && selectMode) { setSelectMode(false); return; }
  if (state.view === 'list') {
    const ids = [...document.querySelectorAll('#list .item')].map((li) => li.dataset.id);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!ids.length) return;
      const i = ids.indexOf(kbId);
      setKb(ids[e.key === 'ArrowDown' ? Math.min(i + 1, ids.length - 1) : (i < 0 ? 0 : Math.max(i - 1, 0))]);
      return;
    }
    const cur = ids.includes(kbId) ? state.homework.find((h) => h.id === kbId) : null;
    if (cur && e.key === ' ' && !e.target.closest('button,input,a,select')) {
      e.preventDefault();
      if (selectMode) { const cb = document.querySelector(`#list .item[data-id="${CSS.escape(kbId)}"] .check`); if (cb) cb.click(); }
      else { setDone(cur, !cur.done); persist(); render(); }
      return;
    }
    if (cur && e.key === 'Delete' && !selectMode) {
      e.preventDefault();
      const i = ids.indexOf(kbId);
      const next = ids[i + 1] || ids[i - 1] || null;
      if (!state.settings.confirmDelete || confirm(`Supprimer « ${cur.title} » ?`)) { kbId = next; deleteItems([cur], 'Devoir supprimé'); }
      return;
    }
  }

  const cal = state.view === 'calendar';
  if (key === 'l') document.querySelector('#viewSeg button[data-view="list"]').click();
  else if (key === 'c') document.querySelector('#viewSeg button[data-view="calendar"]').click();
  else if (cal && e.key === 'ArrowLeft') { e.preventDefault(); $('calPrev').click(); }
  else if (cal && e.key === 'ArrowRight') { e.preventDefault(); $('calNext').click(); }
  else if (cal && key === 't') $('calToday').click();
  else if (cal && key === 'm') document.querySelector('#calModeSeg button[data-mode="month"]').click();
  else if (cal && key === 's') document.querySelector('#calModeSeg button[data-mode="week"]').click();
});


// ---------- Clavier, sélection multiple, tri perso ----------
function setKb(id) {
  kbId = id;
  document.querySelectorAll('#list .item.kb').forEach((x) => x.classList.remove('kb'));
  const li = document.querySelector(`#list .item[data-id="${CSS.escape(id)}"]`);
  if (li) { li.classList.add('kb'); li.scrollIntoView({ block: 'nearest' }); }
}

function renderBulk() {
  $('bulkBar').hidden = !selectMode;
  $('bulkCount').textContent = selected.size ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''}` : 'Coche des devoirs pour les sélectionner';
  $('bulkDone').disabled = $('bulkDel').disabled = selected.size === 0;
}

function setSelectMode(on) {
  selectMode = on;
  selected.clear();
  $('selBtn').classList.toggle('on', on);
  renderBulk();
  renderList();
}

function selectedItems() {
  return state.homework.filter((h) => selected.has(h.id));
}

$('selBtn').addEventListener('click', () => setSelectMode(!selectMode));
$('bulkCancel').addEventListener('click', () => setSelectMode(false));
$('bulkAll').addEventListener('click', () => {
  visibleItems().forEach((h) => selected.add(h.id));
  renderBulk();
  renderList();
});
$('bulkDone').addEventListener('click', () => {
  const items = selectedItems();
  if (!items.length) return;
  items.forEach((h) => setDone(h, true));
  persist();
  setSelectMode(false);
  render();
  showToast(`${items.length} devoir${items.length > 1 ? 's' : ''} terminé${items.length > 1 ? 's' : ''}`);
});
$('bulkDel').addEventListener('click', () => {
  const items = selectedItems();
  if (!items.length) return;
  if (state.settings.confirmDelete && !confirm(`Supprimer ${items.length} devoir${items.length > 1 ? 's' : ''} ?`)) return;
  selected.clear();
  deleteItems(items, `${items.length} devoir${items.length > 1 ? 's supprimés' : ' supprimé'}`);
  setSelectMode(false);
});

function reorderTo(fromId, toId) {
  const items = visibleItems();
  const ids = items.map((h) => h.id);
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return;
  // Numéros uniques pour tous les devoirs, en gardant l'ordre actuel
  [...state.homework].sort((a, b) => ordOf(a) - ordOf(b)).forEach((h, i) => { h.order = i * 10; });
  const orders = items.map((h) => h.order).sort((a, b) => a - b);
  ids.splice(to, 0, ids.splice(from, 1)[0]);
  ids.forEach((id, i) => { state.homework.find((h) => h.id === id).order = orders[i]; });
  persist();
  renderList();
}

// ---------- Réglages d'apparence ----------
$('fontSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-scale]');
  if (!b) return;
  state.settings.fontScale = Number(b.dataset.scale);
  persist();
  applyTheme();
});
$('s-compact').addEventListener('change', (e) => { state.settings.compact = e.target.checked; persist(); applyTheme(); });
setInterval(() => { if (state.settings.theme === 'time') applyTheme(); }, 60 * 1000);

// ---------- Minuteur de travail (Pomodoro, 25 min) ----------
let pomo = null;
const pomoBox = document.createElement('div');
pomoBox.className = 'pomo';
pomoBox.hidden = true;
pomoBox.innerHTML = '<div><b id="pomoTime">25:00</b><br><small id="pomoTitle"></small></div>' +
  '<button type="button" class="ghost small" id="pomoPause">Pause</button><button type="button" class="ghost small" id="pomoStop">Arrêter</button>';
document.body.append(pomoBox);

function renderTimer() {
  pomoBox.hidden = !pomo;
  if (!pomo) return;
  const ms = pomo.left !== null ? pomo.left : Math.max(0, pomo.end - Date.now());
  const s = Math.ceil(ms / 1000);
  $('pomoTime').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  $('pomoTitle').textContent = pomo.title;
  $('pomoPause').textContent = pomo.left !== null ? 'Reprendre' : 'Pause';
}
function stopTimer() {
  if (pomo) clearInterval(pomo.iv);
  pomo = null;
  renderTimer();
}
function startTimer(h) {
  stopTimer();
  pomo = { title: h.title, end: Date.now() + 25 * 60 * 1000, left: null, iv: setInterval(tickTimer, 500) };
  renderTimer();
}
function tickTimer() {
  if (!pomo || pomo.left !== null) return;
  if (Date.now() < pomo.end) { renderTimer(); return; }
  const t = pomo.title;
  stopTimer();
  showToast(`Minuteur terminé : « ${t} ». Fais une pause de 5 minutes !`);
  try { new Notification('Minuteur terminé', { body: `« ${t} » : 25 minutes de travail. Pause de 5 minutes !` }); } catch (_) { /* notification indisponible */ }
}
$('pomoPause').addEventListener('click', () => {
  if (!pomo) return;
  if (pomo.left === null) pomo.left = Math.max(0, pomo.end - Date.now());
  else { pomo.end = Date.now() + pomo.left; pomo.left = null; }
  renderTimer();
});
$('pomoStop').addEventListener('click', stopTimer);

// ---------- Palette de commandes (Ctrl+K) ----------
const cmdDlg = document.createElement('dialog');
cmdDlg.className = 'cmdk';
cmdDlg.id = 'cmdk';
cmdDlg.innerHTML = '<input type="text" id="cmdIn" placeholder="Tape une action : nouveau devoir, thème sombre…" autocomplete="off"><ul id="cmdList"></ul>';
document.body.append(cmdDlg);
let cmdShown = [];
let cmdPos = 0;
const normTxt = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const clickIf = (sel) => { const b = document.querySelector(sel); if (b) b.click(); };
const setTheme = (t) => { state.settings.theme = t; persist(); applyTheme(); };
const setScale = (d) => {
  const steps = [90, 100, 115, 130];
  const i = Math.max(0, steps.indexOf(state.settings.fontScale || 100));
  state.settings.fontScale = steps[Math.min(steps.length - 1, Math.max(0, i + d))];
  persist(); applyTheme();
};

function cmdActions() {
  const a = [
    ['Nouveau devoir', () => openDialog(null), 'ajouter creer'],
    ['Thème clair', () => setTheme('light'), 'theme'],
    ['Thème sombre', () => setTheme('dark'), 'theme nuit'],
    ['Thème automatique (suit Windows)', () => setTheme('auto'), 'theme'],
    ["Thème selon l'heure", () => setTheme('time'), 'theme jour soir'],
    ['Vue liste', () => clickIf('#viewSeg button[data-view="list"]'), 'affichage'],
    ['Vue calendrier', () => clickIf('#viewSeg button[data-view="calendar"]'), 'affichage'],
    ['Statistiques', () => openStats(), 'stats'],
    ['Imprimer / exporter en PDF', () => openPrint(), 'pdf'],
    ['Paramètres', () => openSettings('appearance'), 'reglages options'],
    ['Raccourcis clavier', () => openHelp(), 'aide'],
    [state.settings.compact ? 'Désactiver le mode compact' : 'Activer le mode compact', () => { state.settings.compact = !state.settings.compact; persist(); applyTheme(); }, 'serre dense'],
    ['Texte plus grand', () => setScale(1), 'taille police zoom'],
    ['Texte plus petit', () => setScale(-1), 'taille police zoom'],
    ['Sélection multiple', () => { clickIf('#viewSeg button[data-view="list"]'); setSelectMode(!selectMode); }, 'selectionner plusieurs'],
    ['Tri personnalisé (glisser-déposer)', () => { $('sort').value = 'custom'; $('sort').dispatchEvent(new Event('change')); }, 'ordre trier'],
    ['Minuteur de travail 25 min', () => { const h = state.homework.find((x) => x.id === kbId) || visibleItems().find((x) => !x.done); if (h) startTimer(h); else showToast('Aucun devoir à travailler'); }, 'pomodoro chrono'],
  ];
  [['today', "Aujourd'hui"], ['todo', 'À faire'], ['late', 'En retard'], ['week', 'Cette semaine'], ['done', 'Terminés'], ['all', 'Tous les devoirs']]
    .forEach(([f, l]) => a.push([`Afficher : ${l}`, () => clickIf(`#filters button[data-filter="${f}"]`), 'filtre']));
  if (pomo) a.push(['Arrêter le minuteur', stopTimer, 'pomodoro chrono']);
  return a;
}

function renderCmd() {
  const words = normTxt($('cmdIn').value).split(/\s+/).filter(Boolean);
  cmdShown = cmdActions().filter(([l, , k]) => { const t = normTxt(`${l} ${k || ''}`); return words.every((w) => t.includes(w)); });
  cmdPos = Math.min(cmdPos, Math.max(0, cmdShown.length - 1));
  const ul = $('cmdList');
  ul.textContent = '';
  cmdShown.forEach(([label], i) => {
    const li = el('li', i === cmdPos ? 'on' : '', label);
    li.addEventListener('click', () => runCmd(i));
    ul.append(li);
  });
  const on = ul.querySelector('.on');
  if (on) on.scrollIntoView({ block: 'nearest' });
}
function runCmd(i) {
  const c = cmdShown[i];
  if (!c) return;
  cmdDlg.close();
  setTimeout(c[1], 0);
}
function togglePalette() {
  if (cmdDlg.open) { cmdDlg.close(); return; }
  if (document.querySelector('dialog[open]')) return;
  $('cmdIn').value = '';
  cmdPos = 0;
  renderCmd();
  cmdDlg.showModal();
  $('cmdIn').focus();
}
$('cmdIn').addEventListener('input', () => { cmdPos = 0; renderCmd(); });
$('cmdIn').addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); cmdPos = Math.min(cmdPos + 1, cmdShown.length - 1); renderCmd(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); cmdPos = Math.max(cmdPos - 1, 0); renderCmd(); }
  else if (e.key === 'Enter') { e.preventDefault(); runCmd(cmdPos); }
});
cmdDlg.addEventListener('click', (e) => { if (e.target === cmdDlg) cmdDlg.close(); });

// Rafraîchir à minuit (changement de jour) et au retour sur la fenêtre
let lastDay = todayStr();
function checkDayChange() {
  if (todayStr() !== lastDay) { lastDay = todayStr(); render(); }
}
setInterval(checkDayChange, 60 * 1000);
window.addEventListener('focus', checkDayChange);

// ---------- Démarrage ----------
(async function init() {
  hydrateIcons();
  const data = await window.devoirsAPI.load();
  state.homework = data.homework;
  const pendingSpawned = applyPendingSpawns();

  const defaults = { theme: 'light', accent: 'indigo', sort: 'date', startFilter: 'todo', defaultPriority: '1', confirmDelete: true, updateRepo: DEFAULT_UPDATE_REPO, view: 'list', calMode: 'month', updateTag: '' };
  state.settings = Object.assign(defaults, data.settings);
  state.settings.defaultPriority = String(state.settings.defaultPriority);
  state.settings.notifications = Object.assign({}, NOTIF_DEFAULTS, data.settings && data.settings.notifications);

  if (Array.isArray(state.settings.subjects)) {
    state.settings.subjects = state.settings.subjects
      .filter((s) => s && typeof s.name === 'string' && s.name.trim())
      .map((s) => ({ id: s.id || uid(), name: s.name.trim(), color: typeof s.color === 'string' && /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : NEUTRAL,
        days: Array.isArray(s.days) ? [...new Set(s.days.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort() : [] }));
  } else {
    state.settings.subjects = buildInitialSubjects(state.homework);
    persist();
  }

  state.sort = state.settings.sort || 'date';
  state.filter = FILTER_LABELS[state.settings.startFilter] ? state.settings.startFilter : 'todo';
  state.view = state.settings.view === 'calendar' ? 'calendar' : 'list';
  state.calMode = state.settings.calMode === 'week' ? 'week' : 'month';
  $('sort').value = state.sort;
  applyTheme();
  render();
  appReady = true;
  if (pendingSpawned) persist();
  if (pendingOpenFilter !== null) { openFromNotification(pendingOpenFilter); pendingOpenFilter = null; }
})();
