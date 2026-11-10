'use strict';

// Mini-widget : les devoirs en retard, d'aujourd'hui et de demain, toujours visibles dans un coin de l'écran.
const ACCENTS = {
  indigo: ['#4f6bed', '#7b8cff'], violet: ['#8b5cf6', '#a78bfa'], rose: ['#ec4899', '#f472b6'], rouge: ['#e5484d', '#f2777b'],
  orange: ['#ea6a0a', '#fb923c'], vert: ['#22a06b', '#3ccf91'], turquoise: ['#0d9488', '#2dd4bf'], bleu: ['#0284c7', '#38bdf8'],
};
const $ = (id) => document.getElementById(id);
let lang = 'fr';

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysUntil(str) {
  const [y, m, d] = str.split('-').map(Number);
  const [ty, tm, td] = todayStr().split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - new Date(ty, tm - 1, td)) / 86400000);
}

function resolveTheme(t) {
  if (t === 'dark' || t === 'light') return t;
  if (t === 'time') { const h = new Date().getHours(); return h >= 7 && h < 19 ? 'light' : 'dark'; }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyLook(p) {
  const theme = resolveTheme(p.theme);
  document.documentElement.dataset.theme = theme;
  const a = ACCENTS[p.accent] || ACCENTS.indigo;
  document.documentElement.style.setProperty('--accent', theme === 'dark' ? a[1] : a[0]);
  document.body.classList.toggle('compact', !!p.compact);
  $('wPin').setAttribute('aria-pressed', String(p.pinned));
}

function group(title, cls, items, p) {
  const box = document.createDocumentFragment();
  const head = el('div', 'sec ' + cls, title);
  head.append(el('span', 'n', String(items.length)));
  box.append(head);
  items.forEach((h) => {
    const row = el('label', 'row' + (h.priority === 3 ? ' p3' : ''));
    const sub = p.subjects.find((s) => s.name.trim().toLowerCase() === h.subject.trim().toLowerCase());
    if (sub) row.style.setProperty('--c', sub.color);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.setAttribute('aria-label', 'Marquer comme terminé');
    cb.addEventListener('change', () => {
      row.classList.add('gone'); // retour visuel immédiat ; la liste se rafraîchit ensuite
      window.widgetAPI.setDone(h.id, cb.checked);
    });
    const text = el('div');
    text.append(el('div', 't', h.title));
    const meta = [];
    if (h.subject) meta.push(h.subject);
    if (h.minutes) meta.push(`${h.minutes} min`);
    if (h.subtasks) meta.push(`${h.subtasksDone}/${h.subtasks}`);
    if (meta.length) text.append(el('div', 'm', meta.join(' · ')));
    row.append(cb, text);
    box.append(row);
  });
  return box;
}

function render(p) {
  const body = $('wBody');
  body.textContent = '';
  if (p.locked) {
    const box = el('div', 'locked');
    box.append(el('div', 'big', '🔒'), el('p', null, 'Mes Devoirs est protégé par un code.'));
    const c = p.counts;
    const n = c.late + c.today + c.tomorrow;
    box.append(el('p', null, `${c.today} aujourd'hui · ${c.tomorrow} demain` + (c.late ? ` · ${c.late} en retard` : '')));
    if (!n) box.lastChild.textContent = 'Rien à faire pour le moment.';
    const b = el('button', null, 'Ouvrir Mes Devoirs');
    b.type = 'button';
    b.addEventListener('click', () => window.widgetAPI.openApp());
    box.append(b);
    body.append(box);
    return;
  }
  const late = p.items.filter((h) => daysUntil(h.date) < 0);
  const today = p.items.filter((h) => daysUntil(h.date) === 0);
  const tomorrow = p.items.filter((h) => daysUntil(h.date) === 1);
  const prio = (a, b) => (b.priority - a.priority) || a.date.localeCompare(b.date);
  if (!late.length && !today.length && !tomorrow.length) {
    const e = el('div', 'empty');
    e.append(el('div', 'big', '🎉'), el('div', null, "Rien à faire aujourd'hui ni demain."));
    body.append(e);
    return;
  }
  if (late.length) body.append(group('En retard', 'late', late.sort(prio), p));
  if (today.length) body.append(group("Aujourd'hui", '', today.sort(prio), p));
  if (tomorrow.length) body.append(group('Demain', '', tomorrow.sort(prio), p));
}

let busy = false;
let again = false;
async function refresh() {
  if (busy) { again = true; return; } // une mise à jour est arrivée pendant la précédente : on en refait une
  busy = true;
  try {
    const p = await window.widgetAPI.load();
    if (p.language !== lang) { lang = p.language; document.documentElement.lang = lang; if (window.I18N) window.I18N.start(lang); }
    applyLook(p);
    render(p);
  } catch (e) { /* on réessaiera */ } finally { busy = false; if (again) { again = false; refresh(); } }
}

$('wNew').addEventListener('click', () => window.widgetAPI.newHomework());
$('wOpen').addEventListener('click', () => window.widgetAPI.openApp());
$('wClose').addEventListener('click', () => window.widgetAPI.close());
$('wPin').addEventListener('click', async () => { const pinned = await window.widgetAPI.togglePin(); $('wPin').setAttribute('aria-pressed', String(pinned)); });
window.widgetAPI.onRefresh(refresh);
setInterval(refresh, 60 * 1000); // change de jour, thème « selon l'heure »
refresh();
