'use strict';

const PALETTE = ['#4f6bed', '#e5484d', '#22a06b', '#f59e0b', '#a855f7', '#0ea5e9', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];
const PRIORITY_LABELS = { 1: 'Normale', 2: 'Importante', 3: 'Urgente' };

const state = {
  homework: [],
  settings: { theme: 'light' },
  filter: 'todo',
  subject: null, // null = toutes les matières
  search: '',
  sort: 'date',
  editingId: null,
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

function subjectColor(name) {
  if (!name) return '#8b93a7';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.toLowerCase().charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function isLate(h) {
  return !h.done && h.date && daysUntil(h.date) < 0;
}

function isThisWeek(h) {
  if (h.done || !h.date) return false;
  const n = daysUntil(h.date);
  return n >= 0 && n <= 7;
}

// ---------- Sauvegarde ----------
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    window.devoirsAPI.save({ homework: state.homework, settings: state.settings });
  }, 150);
}

// ---------- Filtrage ----------
function visibleItems() {
  const q = state.search.trim().toLowerCase();
  let items = state.homework.filter((h) => {
    if (state.subject !== null && (h.subject || '') !== state.subject) return false;
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
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

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
  const s1 = el('strong', null, String(todo));
  stats.append(s1, ` devoir${todo > 1 ? 's' : ''} à faire`);
  if (late > 0) {
    stats.append(' · ');
    const s2 = el('strong', null, String(late));
    s2.style.color = 'var(--danger)';
    stats.append(s2, ` en retard`);
  }
}

function renderSubjects() {
  const box = $('subjectList');
  box.textContent = '';
  const names = [...new Set(state.homework.map((h) => h.subject || '').filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));

  if (names.length === 0) {
    box.append(el('div', 'muted', 'Aucune matière pour le moment'));
  } else {
    const all = el('button', state.subject === null ? 'active' : '');
    all.append(el('span', 'dot'), 'Toutes');
    all.firstChild.style.background = 'var(--muted)';
    all.addEventListener('click', () => { state.subject = null; render(); });
    box.append(all);

    names.forEach((name) => {
      const b = el('button', state.subject === name ? 'active' : '');
      const dot = el('span', 'dot');
      dot.style.background = subjectColor(name);
      b.append(dot, name);
      b.addEventListener('click', () => { state.subject = state.subject === name ? null : name; render(); });
      box.append(b);
    });
  }

  const dl = $('subjectsData');
  dl.textContent = '';
  names.forEach((n) => { const o = document.createElement('option'); o.value = n; dl.append(o); });
}

function renderList() {
  const list = $('list');
  list.textContent = '';
  const items = visibleItems();

  $('empty').hidden = items.length > 0;
  if (items.length === 0) {
    const msgs = {
      todo: ['🎉', 'Aucun devoir à faire. Profites-en !'],
      late: ['👍', "Aucun devoir en retard."],
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
    const li = el('li', 'item' + (h.done ? ' done' : ''));
    li.style.setProperty('--c', subjectColor(h.subject));

    const cb = document.createElement('input');
    cb.type = 'checkbox';
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
      const t = el('span', 'tag subject', h.subject);
      t.style.setProperty('--c', subjectColor(h.subject));
      meta.append(t);
    }
    if (h.date) {
      const due = h.done ? { text: formatDate(h.date), cls: '' } : dueLabel(h.date);
      meta.append(el('span', 'tag ' + due.cls, '📅 ' + due.text));
    }
    if (h.priority > 1) meta.append(el('span', 'tag p' + h.priority, PRIORITY_LABELS[h.priority]));
    body.append(meta);

    const btns = el('div', 'btns');
    const edit = el('button', null, '✏️');
    edit.title = 'Modifier';
    edit.setAttribute('aria-label', 'Modifier');
    edit.addEventListener('click', () => openDialog(h.id));
    const del = el('button', null, '🗑️');
    del.title = 'Supprimer';
    del.setAttribute('aria-label', 'Supprimer');
    del.addEventListener('click', () => {
      if (confirm(`Supprimer « ${h.title} » ?`)) {
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

function render() {
  document.querySelectorAll('#filters button').forEach((b) => {
    b.classList.toggle('active', b.dataset.filter === state.filter);
  });
  renderCounts();
  renderSubjects();
  renderList();
}

// ---------- Thème ----------
function applyTheme() {
  document.documentElement.dataset.theme = state.settings.theme === 'dark' ? 'dark' : 'light';
  $('themeBtn').textContent = state.settings.theme === 'dark' ? '☀️' : '🌙';
}

// ---------- Boîte de dialogue ----------
function openDialog(id) {
  state.editingId = id || null;
  const h = id ? state.homework.find((x) => x.id === id) : null;
  $('dialogTitle').textContent = h ? 'Modifier le devoir' : 'Nouveau devoir';
  $('f-title').value = h ? h.title : '';
  $('f-subject').value = h ? h.subject || '' : (state.subject || '');
  $('f-date').value = h ? h.date || '' : '';
  $('f-priority').value = h ? String(h.priority || 1) : '1';
  $('f-notes').value = h ? h.notes || '' : '';
  $('dialog').showModal();
  $('f-title').focus();
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('f-title').value.trim();
  if (!title) return;
  const data = {
    title,
    subject: $('f-subject').value.trim(),
    date: $('f-date').value,
    priority: Number($('f-priority').value) || 1,
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

// ---------- Événements ----------
$('newBtn').addEventListener('click', () => openDialog(null));

$('filters').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-filter]');
  if (!b) return;
  state.filter = b.dataset.filter;
  render();
});

$('search').addEventListener('input', (e) => { state.search = e.target.value; renderList(); });

$('sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  state.settings.sort = state.sort;
  persist();
  renderList();
});

$('themeBtn').addEventListener('click', () => {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  persist();
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
  const data = await window.devoirsAPI.load();
  state.homework = data.homework;
  state.settings = Object.assign({ theme: 'light', sort: 'date' }, data.settings);
  state.sort = state.settings.sort || 'date';
  $('sort').value = state.sort;
  applyTheme();
  render();
})();
