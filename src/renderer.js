'use strict';

// ---------- Constantes ----------
const PRIORITY_LABELS = { 1: 'Normale', 2: 'Importante', 3: 'Urgente' };
const FILTER_LABELS = { todo: 'À faire', late: 'En retard', week: 'Cette semaine', done: 'Terminés', all: 'Tous les devoirs' };
const NEUTRAL = '#8b93a7';
const DEFAULT_UPDATE_REPO = 'rc9b8hcntp-svg/mydevoirs';
const NOTIF_DEFAULTS = { enabled: true, time: '18:00', daysAhead: 1, includeLate: true, background: true, startup: false };

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
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
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
function visibleItems() {
  const q = state.search.trim().toLowerCase();
  const items = state.homework.filter((h) => {
    if (state.subject !== null && !sameName(h.subject, state.subject)) return false;
    if (q && !(`${h.title} ${h.subject || ''} ${h.notes || ''}`.toLowerCase().includes(q))) return false;
    switch (state.filter) {
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
      default: return byDate(a, b) || (b.priority - a.priority);
    }
  });
  return items;
}

// ---------- Rendu ----------
function renderCounts() {
  const hw = state.homework;
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

function renderList() {
  const list = $('list');
  list.textContent = '';
  const items = visibleItems();

  $('empty').hidden = items.length > 0;
  if (items.length === 0) {
    const msgs = {
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

  items.forEach((h) => {
    const color = subjectColor(h.subject);
    const li = el('li', 'item' + (h.done ? ' done' : ''));
    li.style.setProperty('--c', color);

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'check';
    cb.checked = !!h.done;
    cb.setAttribute('aria-label', 'Marquer comme terminé');
    cb.addEventListener('change', () => {
      h.done = cb.checked;
      h.doneAt = cb.checked ? Date.now() : null;
      persist();
      render();
    });

    const body = el('div', 'body');
    body.append(el('div', 'title', h.title));
    if (h.notes) body.append(el('div', 'notes', h.notes));

    const meta = el('div', 'meta');
    if (h.subject) {
      const t = el('span', 'tag subject');
      t.style.setProperty('--c', color);
      t.append(el('span', 'dot'), h.subject);
      meta.append(t);
    }
    if (h.date) {
      const due = h.done ? { text: formatDate(h.date), cls: '' } : dueLabel(h.date);
      const tag = el('span', 'tag ' + due.cls);
      tag.append(mkIcon('calendar'), due.text);
      meta.append(tag);
    }
    if (h.priority > 1) meta.append(el('span', 'tag p' + h.priority, PRIORITY_LABELS[h.priority]));
    body.append(meta);

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
      if (!state.settings.confirmDelete || confirm(`Supprimer « ${h.title} » ?`)) {
        state.homework = state.homework.filter((x) => x.id !== h.id);
        persist();
        render();
      }
    });
    btns.append(edit, del);

    li.append(cb, body, btns);
    list.append(li);
  });
}

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
      if (week) {
        if (h.subject) chip.append(el('span', 'cs', h.subject));
        chip.append(el('span', 'ct', h.title));
        if (h.priority > 1) chip.append(el('span', 'cp p' + h.priority, PRIORITY_LABELS[h.priority]));
      } else {
        chip.textContent = (h.subject ? h.subject + ' · ' : '') + h.title;
      }
      chip.style.setProperty('--c', subjectColor(h.subject));
      chip.title = h.title + (h.notes ? '\n' + h.notes : '');
      chip.addEventListener('click', (e) => { e.stopPropagation(); openDialog(h.id); });
      box.append(chip);
    });
    cell.append(box);
    cell.addEventListener('click', () => openDialog(null, key));
    grid.append(cell);
  }
}

function renderView() {
  const cal = state.view === 'calendar';
  $('calendar').hidden = !cal;
  $('list').hidden = cal;
  $('sort').hidden = cal;
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

  list.forEach((s) => {
    const on = sameName(s.name, pickedSubject);
    const b = button('chip' + (on ? ' on' : ''));
    b.style.setProperty('--c', s.color);
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

function openDialog(id, presetDate) {
  state.editingId = id || null;
  const h = id ? state.homework.find((x) => x.id === id) : null;
  $('dialogTitle').textContent = h ? 'Modifier le devoir' : 'Nouveau devoir';
  $('f-title').value = h ? h.title : '';
  $('f-date').value = h ? h.date || '' : (presetDate || '');
  $('f-notes').value = h ? h.notes || '' : '';
  setPriority(h ? (h.priority || 1) : (state.settings.defaultPriority || 1));
  pickedSubject = h ? h.subject || '' : (state.subject || '');
  closeQuickAdd();
  renderPicker();
  $('dialog').showModal();
  $('f-title').focus();
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('f-title').value.trim();
  if (!title) return;
  const data = {
    title,
    subject: pickedSubject,
    date: $('f-date').value,
    priority: Number(pickedPriority) || 1,
    notes: $('f-notes').value.trim(),
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
  if (tab === 'update') loadTags();
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
    state.homework = state.homework.filter((h) => !h.done);
    persist();
    render();
  }
});

document.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); openDialog(null); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); $('search').focus(); }
});

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

  const defaults = { theme: 'light', accent: 'indigo', sort: 'date', startFilter: 'todo', defaultPriority: '1', confirmDelete: true, updateRepo: DEFAULT_UPDATE_REPO, view: 'list', calMode: 'month', updateTag: '' };
  state.settings = Object.assign(defaults, data.settings);
  state.settings.defaultPriority = String(state.settings.defaultPriority);
  state.settings.notifications = Object.assign({}, NOTIF_DEFAULTS, data.settings && data.settings.notifications);

  if (Array.isArray(state.settings.subjects)) {
    state.settings.subjects = state.settings.subjects
      .filter((s) => s && typeof s.name === 'string' && s.name.trim())
      .map((s) => ({ id: s.id || uid(), name: s.name.trim(), color: typeof s.color === 'string' && /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : NEUTRAL }));
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
  if (pendingOpenFilter !== null) { openFromNotification(pendingOpenFilter); pendingOpenFilter = null; }
})();
