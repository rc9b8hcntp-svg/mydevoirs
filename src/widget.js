'use strict';

// Mini-widget : les devoirs en retard, d'aujourd'hui et de demain, toujours visibles dans un coin de l'écran.
const ACCENTS = {
  indigo: ['#4f6bed', '#7b8cff'], violet: ['#8b5cf6', '#a78bfa'], rose: ['#ec4899', '#f472b6'], rouge: ['#e5484d', '#f2777b'],
  orange: ['#ea6a0a', '#fb923c'], vert: ['#22a06b', '#3ccf91'], turquoise: ['#0d9488', '#2dd4bf'], bleu: ['#0284c7', '#38bdf8'],
};
const $ = (id) => document.getElementById(id);
let lang = 'fr';
let cur = null; // dernières données reçues
const T = (fr, en) => (lang === 'en' ? en : fr);

// Mémoire légère de l'affichage (sections repliées, devoirs dépliés)
const shut = new Set();
try { JSON.parse(localStorage.getItem('wShut') || '[]').forEach((k) => shut.add(k)); } catch (e) { /* pas grave */ }
const saveShut = () => { try { localStorage.setItem('wShut', JSON.stringify([...shut])); } catch (e) { /* pas grave */ } };
const opened = new Set();

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


function dateLabel(str) {
  const n = daysUntil(str);
  if (n === 0) return T("aujourd'hui", 'today');
  if (n === 1) return T('demain', 'tomorrow');
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ---------- Message avec « Annuler » ----------
let toastTimer = null;
function toast(text, undo) {
  const box = $('wToast');
  box.textContent = '';
  box.append(el('span', null, text));
  if (undo) {
    const b = el('button', null, T('Annuler', 'Undo'));
    b.type = 'button';
    b.addEventListener('click', () => { hideToast(); undo(); });
    box.append(b);
  }
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 6000);
}
function hideToast() { clearTimeout(toastTimer); $('wToast').hidden = true; }

function subjectColor(p, name) {
  const sub = p.subjects.find((s) => s.name.trim().toLowerCase() === String(name || '').trim().toLowerCase());
  return sub ? sub.color : '';
}

function makeRow(h, p) {
  const row = el('div', 'row' + (h.priority === 3 ? ' p3' : ''));
  const color = subjectColor(p, h.subject);
  if (color) row.style.setProperty('--c', color);

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.setAttribute('aria-label', T('Marquer comme terminé', 'Mark as done'));
  cb.addEventListener('change', () => {
    row.classList.add('gone'); // retour visuel immédiat ; la liste se rafraîchit ensuite
    window.widgetAPI.setDone(h.id, cb.checked);
    if (cb.checked) toast(`« ${h.title} » ${T('terminé', 'done')}`, () => window.widgetAPI.setDone(h.id, false));
  });

  const main = el('div', 'main');
  main.dataset.notr = '';
  main.append(el('div', 't', h.title));
  const meta = el('div', 'm');
  const late = -daysUntil(h.date);
  const bits = [];
  if (late > 0) bits.push(['late', T(late === 1 ? '1 j de retard' : `${late} j de retard`, late === 1 ? '1 d late' : `${late} d late`)]);
  if (h.subject) bits.push(['', h.subject]);
  if (h.minutes) bits.push(['', `${h.minutes} min`]);
  if (h.subtasks) bits.push(['', `${h.subtasksDone}/${h.subtasks}`]);
  bits.forEach(([c, t], i) => {
    if (i) meta.append(document.createTextNode(' · '));
    meta.append(c ? el('span', c, t) : document.createTextNode(t));
  });
  if (bits.length) main.append(meta);
  if (h.subtasks) {
    const bar = el('div', 'mini-bar');
    const fill = document.createElement('i');
    fill.style.width = Math.round((h.subtasksDone / h.subtasks) * 100) + '%';
    bar.append(fill);
    main.append(bar);
  }
  row.append(cb, main);

  if (h.subtaskList && h.subtaskList.length) {
    const isOpen = opened.has(h.id);
    const chev = el('button', 'chev', '▸');
    chev.type = 'button';
    chev.setAttribute('aria-expanded', String(isOpen));
    chev.setAttribute('aria-label', T('Afficher les sous-tâches', 'Show subtasks'));
    const toggle = () => { if (opened.has(h.id)) opened.delete(h.id); else opened.add(h.id); render(cur); };
    chev.addEventListener('click', toggle);
    main.classList.add('tog');
    main.addEventListener('click', toggle);
    row.append(chev);
    if (isOpen) {
      const subs = el('div', 'subs');
      subs.dataset.notr = '';
      h.subtaskList.forEach((st) => {
        const line = el('label', 'sub' + (st.done ? ' done' : ''));
        const c = document.createElement('input');
        c.type = 'checkbox';
        c.checked = st.done;
        c.addEventListener('change', () => { line.classList.toggle('done', c.checked); window.widgetAPI.setSubtask(h.id, st.id, c.checked); });
        line.append(c, el('span', null, st.text));
        subs.append(line);
      });
      row.append(subs);
    }
  }
  return row;
}

function group(key, title, cls, items, p) {
  const box = document.createDocumentFragment();
  const closed = shut.has(key);
  const head = el('div', 'sec ' + cls + (closed ? ' shut' : ''), title);
  head.append(el('span', 'n', String(items.length)));
  head.setAttribute('role', 'button');
  head.tabIndex = 0;
  head.setAttribute('aria-expanded', String(!closed));
  const flip = () => { if (shut.has(key)) shut.delete(key); else shut.add(key); saveShut(); render(cur); };
  head.addEventListener('click', flip);
  head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  box.append(head);
  if (!closed) items.forEach((h) => box.append(makeRow(h, p)));
  return box;
}

// Barre de titre (compteurs quand le widget est réduit), progression du jour, champ d'ajout
function renderChrome(p) {
  const c = p.counts;
  const title = $('wTitle');
  const name = T('Mes Devoirs', 'My Homework');
  if (p.collapsed) {
    const n = c.late + c.today;
    title.textContent = '';
    title.append(document.createTextNode('📚 '));
    if (p.locked) title.append(el('span', 'pill', '🔒'));
    else if (!n) title.append(el('span', 'pill ok', T('Tout est fait ✓', 'All done ✓')));
    else {
      if (c.late) title.append(el('span', 'pill late', `⚠ ${c.late}`), document.createTextNode(' · '));
      title.append(el('span', 'pill', T(`${c.today} aujourd'hui`, `${c.today} today`)));
    }
  } else title.textContent = '📚 ' + name;

  const btn = $('wCollapse');
  btn.setAttribute('aria-expanded', String(!p.collapsed));
  const lbl = p.collapsed ? T('Agrandir le widget', 'Expand the widget') : T('Réduire le widget', 'Collapse the widget');
  btn.title = lbl;
  btn.setAttribute('aria-label', lbl);
  document.body.classList.toggle('min', !!p.collapsed);

  const t = p.today;
  const showProg = !p.locked && t.total > 0;
  $('wProg').hidden = !showProg;
  if (showProg) {
    const pct = Math.round((t.done / t.total) * 100);
    const all = t.done >= t.total;
    $('wProg').classList.toggle('all', all);
    const txt = $('wProgText');
    txt.textContent = '';
    if (all) txt.append(el('span', null, T("Journée terminée 🎉", 'Day complete 🎉')));
    else {
      const left = el('span');
      left.append(el('b', null, `${t.done}/${t.total}`), document.createTextNode(' ' + T("faits aujourd'hui", 'done today')));
      txt.append(left);
    }
    txt.append(el('span', null, pct + ' %'));
    $('wProgFill').style.width = pct + '%';
    $('wProgBar').setAttribute('aria-valuenow', String(pct));
  }

  $('wAddForm').hidden = !!p.locked;
  $('wAdd').placeholder = T('Ajouter : Maths ex 5 vendredi !', 'Add: Maths ex 5 friday !');
  $('wAdd').setAttribute('aria-label', T('Ajouter un devoir', 'Add an assignment'));
}

function render(p) {
  if (!p) return;
  const body = $('wBody');
  const scroll = body.scrollTop;
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
  if (late.length) body.append(group('late', 'En retard', 'late', late.sort(prio), p));
  if (today.length) body.append(group('today', "Aujourd'hui", '', today.sort(prio), p));
  if (tomorrow.length) body.append(group('tomorrow', 'Demain', '', tomorrow.sort(prio), p));
  body.scrollTop = scroll;
}

// ---------- Ajout rapide : « Maths ex 5 p.12 pour vendredi ! 30 min #groupe » ----------
const addInput = $('wAdd');
function quickParse() {
  const r = window.QuickAdd.parseQuick(addInput.value, { today: todayStr(), subjects: cur ? cur.subjects : [] });
  if (!r.date) r.date = todayStr(); // le widget montre aujourd'hui et demain : sans date, c'est pour aujourd'hui
  return r;
}
function renderPreview() {
  const box = $('wPreview');
  box.textContent = '';
  const text = addInput.value.trim();
  box.hidden = !text;
  if (!text || !cur) return;
  const r = quickParse();
  if (!r.title) { box.append(el('span', null, T('Ajoute au moins un titre.', 'Add at least a title.'))); return; }
  box.append(el('span', 'pt', r.title));
  if (r.subject) {
    const chip = el('span', 'chip c', r.subject);
    chip.style.setProperty('--c', subjectColor(cur, r.subject) || 'var(--muted)');
    box.append(chip);
  }
  box.append(el('span', 'chip', dateLabel(r.date)));
  if (r.found.priority) box.append(el('span', 'chip', r.priority === 3 ? '❗' : '!'));
  if (r.minutes) box.append(el('span', 'chip', `${r.minutes} min`));
  r.tags.forEach((t) => box.append(el('span', 'chip', '#' + t)));
}
addInput.addEventListener('input', renderPreview);
addInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); if (addInput.value) { addInput.value = ''; renderPreview(); } else addInput.blur(); }
});
$('wAddForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!addInput.value.trim() || !cur) return;
  const r = quickParse();
  if (!r.title) { addInput.classList.add('shake'); setTimeout(() => addInput.classList.remove('shake'), 300); return; }
  const res = await window.widgetAPI.add({
    title: r.title, subject: r.subject, date: r.date, priority: r.found.priority ? r.priority : 0, minutes: r.minutes, kind: r.kind, tags: r.tags,
  });
  if (!res || !res.ok) { toast(T("Impossible d'ajouter (application verrouillée ?)", 'Could not add (app locked?)')); return; }
  addInput.value = '';
  renderPreview();
  toast(T(`Ajouté pour ${dateLabel(res.date)} : « ${res.title} »`, `Added for ${dateLabel(res.date)}: “${res.title}”`));
});

let busy = false;
let again = false;
async function refresh() {
  if (busy) { again = true; return; } // une mise à jour est arrivée pendant la précédente : on en refait une
  busy = true;
  try {
    const p = await window.widgetAPI.load();
    if (p.language !== lang) { lang = p.language; document.documentElement.lang = lang; if (window.I18N) window.I18N.start(lang); }
    cur = p;
    applyLook(p);
    renderChrome(p);
    render(p);
  } catch (e) { /* on réessaiera */ } finally { busy = false; if (again) { again = false; refresh(); } }
}

$('wNew').addEventListener('click', () => window.widgetAPI.newHomework());
$('wOpen').addEventListener('click', () => window.widgetAPI.openApp());
$('wCollapse').addEventListener('click', async () => { await window.widgetAPI.collapse(); refresh(); });
$('wClose').addEventListener('click', () => window.widgetAPI.close());
$('wPin').addEventListener('click', async () => { const pinned = await window.widgetAPI.togglePin(); $('wPin').setAttribute('aria-pressed', String(pinned)); });
window.widgetAPI.onRefresh(refresh);
setInterval(refresh, 60 * 1000); // change de jour, thème « selon l'heure »
refresh();
