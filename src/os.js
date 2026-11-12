'use strict';

const api = window.cartable;
const $ = (id) => document.getElementById(id);

const ICONS = {
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  min: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" fill-opacity=".25"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  checkWin: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8.5 15l2.5 2.5 4.5-4.5"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M14.5 6L8.5 12l6 6"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
};

let state = null;
let drawerOpen = false;
let editingId = null;   // application en cours de modification dans les réglages
let addingApp = false;

// ---------- Outils ----------
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function icon(name) {
  const s = el('span', 'ico');
  s.innerHTML = ICONS[name] || '';
  return s;
}

function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-ico]').forEach((n) => { if (!n.firstChild) n.innerHTML = ICONS[n.dataset.ico] || ''; });
}

const pad = (n) => String(n).padStart(2, '0');
const hhmm = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

function dayLabel(ms, now) {
  const d = new Date(ms);
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(new Date(now).getFullYear(), new Date(now).getMonth(), new Date(now).getDate())) / 86400000);
  if (diff === 0) return 'aujourd\'hui';
  if (diff === 1) return 'demain';
  return d.toLocaleDateString('fr-FR', { weekday: 'long' });
}

let toastTimer = 0;
function toast(text, isErr) {
  const t = $('toast');
  t.textContent = text;
  t.className = isErr ? 'toast err' : 'toast';
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, isErr ? 6000 : 3500);
}

function hue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// Pastille d'une application : couleur et symbole selon son type
function appIcon(app, cls) {
  const box = el('span', cls);
  const t = `t-${app.kind}`;
  if (app.kind === 'word') { box.classList.add(t); box.textContent = 'W'; }
  else if (app.kind === 'excel') { box.classList.add(t); box.textContent = 'X'; }
  else if (app.kind === 'powerpoint') { box.classList.add(t); box.textContent = 'P'; }
  else if (app.kind === 'explorer') { box.classList.add(t); box.append(icon('folder')); }
  else if (app.kind === 'devoirs') { box.classList.add(t); box.append(icon('check')); }
  else if (app.kind === 'devoirs-embed') { box.classList.add(t); box.append(icon('checkWin')); }
  else {
    const h = hue(app.name);
    box.style.setProperty('--c1', `hsl(${h} 75% 62%)`);
    box.style.setProperty('--c2', `hsl(${(h + 25) % 360} 70% 42%)`);
    if (/^https?:/i.test(app.target)) box.append(icon('globe'));
    else box.textContent = (app.name.trim()[0] || '?').toUpperCase();
  }
  return box;
}

const REASONS = {
  'not-found': 'Introuvable. Vérifie que le logiciel est installé, ou change son chemin dans Réglages → Applications.',
  launch: 'Impossible de l\'ouvrir.',
  invalid: 'Cette application n\'est pas valide.',
  'not-installed': 'Le logiciel Mes Devoirs n\'est pas installé à côté de Cartable OS. Réinstalle Cartable OS pour le récupérer, ou utilise Mes Devoirs intégré.',
  missing: 'Mes Devoirs intégré est introuvable. Réinstalle Cartable OS.',
};

async function launch(id) {
  const r = await api.launch(id);
  if (r && !r.ok) toast(REASONS[r.reason] || 'Impossible de l\'ouvrir.', true);
}

// ---------- Accueil ----------
function renderClock() {
  const now = new Date();
  $('clock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  $('date').textContent = date.charAt(0).toUpperCase() + date.slice(1);
}

function renderNow() {
  const box = $('nowBlock');
  box.textContent = '';
  if (!state.schedule.loaded) {
    const card = el('div', 'empty-card');
    const txt = el('p');
    txt.append(el('strong', '', 'Ajoute ton emploi du temps'));
    txt.append('Avec un fichier .ics, Cartable OS reste ouvert pendant tes cours et ouvre le dossier de chaque matière quand elle commence.');
    const b = el('button', 'btn btn-primary', 'Choisir le fichier');
    b.type = 'button';
    b.addEventListener('click', () => { openDrawer(); importSchedule(); });
    card.append(txt, b);
    box.append(card);
    return;
  }
  const now = Date.now();
  const s = state.schedule;
  const line = el('div', 'now-line');
  const title = el('div', 'now-title');
  if (s.current) {
    title.append(el('span', 'live-dot'), s.current.subject || s.current.summary);
    const sub = el('small', '', `jusqu'à ${hhmm(s.current.endMs)}${s.current.location ? ` · ${s.current.location}` : ''}`);
    title.append(sub);
    line.append(title);
    if (s.current.subject) {
      const b = el('button', 'btn btn-soft', 'Ouvrir le dossier');
      b.type = 'button';
      b.addEventListener('click', async () => { const r = await api.openFolder(s.current.subject); if (r && !r.ok) toast('Impossible d\'ouvrir le dossier.', true); });
      line.append(b);
    }
  } else if (s.next) {
    title.append(`Prochain cours : ${s.next.subject || s.next.summary}`);
    title.append(el('small', '', `${dayLabel(s.next.startMs, now)} à ${hhmm(s.next.startMs)}${s.next.location ? ` · ${s.next.location}` : ''}`));
    line.append(title);
  } else {
    title.append('Plus de cours au programme');
    title.append(el('small', '', 'Aucun cours dans les 7 prochains jours.'));
    line.append(title);
  }
  box.append(line);
}

function renderDay() {
  const box = $('dayBlock');
  box.textContent = '';
  const s = state.schedule;
  if (!s.loaded || !s.session || !s.today.length) return;
  const { startMs, endMs } = s.session;
  const span = endMs - startMs;
  const now = Date.now();
  const track = el('div', 'track');
  const curKey = s.current ? s.current.key : '';
  s.today.forEach((o) => {
    const b = el('button', 'seg');
    b.type = 'button';
    const left = ((o.startMs - startMs) / span) * 100;
    const width = Math.max(((o.endMs - o.startMs) / span) * 100, 1);
    b.style.left = `calc(${left}% + 4px)`;
    b.style.width = `calc(${width}% - 8px)`;
    if (o.key === curKey) b.classList.add('current');
    else if (o.endMs <= now) b.classList.add('past');
    if (width < 9) b.classList.add('tiny');
    b.dataset.end = String(o.endMs);
    b.title = `${o.subject || o.summary} · ${hhmm(o.startMs)}–${hhmm(o.endMs)}${o.location ? ` · ${o.location}` : ''}`;
    b.append(el('span', 'seg-name', o.subject || o.summary), el('span', 'seg-time', `${hhmm(o.startMs)}–${hhmm(o.endMs)}`));
    if (o.subject) b.addEventListener('click', () => api.openFolder(o.subject));
    track.append(b);
  });
  const m = el('div', 'marker');
  m.dataset.start = String(startMs);
  m.dataset.span = String(span);
  track.append(m);
  const ends = el('div', 'track-ends');
  ends.append(el('span', '', `Cartable OS ouvert dès ${hhmm(startMs)}`), el('span', '', `jusqu'à ${hhmm(endMs)}`));
  box.append(track, ends);
}

// Chaque seconde : on déplace le trait « maintenant » sans refaire la frise (sinon un clic en cours serait perdu)
function updateDayLive() {
  const m = document.querySelector('#dayBlock .marker');
  if (!m) return;
  const now = Date.now();
  const start = Number(m.dataset.start);
  const span = Number(m.dataset.span);
  m.hidden = now < start || now > start + span;
  m.style.left = `${((now - start) / span) * 100}%`;
  document.querySelectorAll('#dayBlock .seg').forEach((b) => {
    if (!b.classList.contains('current') && Number(b.dataset.end) <= now) b.classList.add('past');
  });
}

function renderApps() {
  const box = $('apps');
  box.textContent = '';
  state.apps.forEach((a) => {
    const b = el('button', 'tile');
    b.type = 'button';
    b.setAttribute('role', 'listitem');
    b.append(appIcon(a, 'tile-icon'), el('span', 'tile-name', a.name));
    if (a.sub) b.append(el('span', 'tile-sub', a.sub));
    b.addEventListener('click', () => launch(a.id));
    box.append(b);
  });
}

// ---------- Mes Devoirs ----------
function dueText(date) {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(y, m - 1, d);
  const n = new Date();
  const diff = Math.round((t - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000);
  if (diff < -1) return `en retard de ${-diff} jours`;
  if (diff === -1) return 'à rendre hier';
  if (diff === 0) return 'à rendre aujourd\'hui';
  if (diff === 1) return 'à rendre demain';
  return `pour ${t.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}`;
}

function dvGroup(title, list, cls, withDate) {
  if (!list.length) return null;
  const g = el('section', `dv-group ${cls || ''}`);
  const h = el('h3', '', title);
  h.append(el('span', 'count', String(list.length)));
  g.append(h);
  list.slice(0, 6).forEach((hw) => {
    const it = el('div', 'dv-item');
    it.append(el('div', 'dv-item-title', hw.title));
    const meta = [hw.subject, hw.date && withDate ? dueText(hw.date) : ''].filter(Boolean).join(' · ');
    if (meta) it.append(el('div', 'dv-item-meta', meta));
    g.append(it);
  });
  if (list.length > 6) g.append(el('div', 'dv-more', `et ${list.length - 6} autres dans Mes Devoirs`));
  return g;
}

function renderDevoirs() {
  const body = $('dvBody');
  body.textContent = '';
  const dv = state.devoirs;
  $('dvOpen').disabled = !dv.embedAvailable && !dv.installed;
  if (!dv.embedAvailable && !dv.installed) {
    const e = el('div', 'dv-empty');
    e.append(el('strong', '', 'Mes Devoirs est introuvable'), 'Il s\'installe avec Cartable OS. Réinstalle Cartable OS pour le récupérer.');
    body.append(e);
    return;
  }
  const s = dv.summary;
  if (!s.found) {
    const e = el('div', 'dv-empty');
    e.append(el('strong', '', 'Pas encore de devoirs'), 'Ouvre Mes Devoirs et note ton premier devoir : il apparaîtra ici.');
    body.append(e);
    return;
  }
  const cur = state.schedule.current;
  const parts = [];
  if (cur && cur.subject && s.forCourse.length) parts.push(dvGroup(`Pour ce cours · ${cur.subject}`, s.forCourse, 'course', true));
  parts.push(dvGroup('En retard', s.late, 'late', true), dvGroup('Aujourd\'hui', s.today), dvGroup('Demain', s.tomorrow), dvGroup('Cette semaine', s.soon, '', true));
  const groups = parts.filter(Boolean);
  if (!groups.length) {
    const e = el('div', 'dv-empty');
    e.append(el('strong', '', s.total ? 'Rien d\'urgent cette semaine' : 'Tout est fait'), s.total ? `${s.total} devoir${s.total > 1 ? 's' : ''} à faire plus tard.` : 'Aucun devoir à rendre.');
    body.append(e);
    return;
  }
  groups.forEach((g) => body.append(g));
  body.append(el('div', 'dv-foot', 'Pour cocher un devoir, ouvre Mes Devoirs.'));
}

// ---------- Réglages ----------
function toggleRow(title, sub, checked, onChange) {
  const lab = el('label', 'toggle');
  const txt = el('span', 'txt');
  txt.append(el('b', '', title), el('span', '', sub));
  const sw = el('span', 'switch');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  sw.append(input, el('i'));
  lab.append(txt, sw);
  return lab;
}

function sectionScheduleSettings() {
  const sec = el('section', 'sec');
  const s = state.schedule;
  sec.append(el('h3', '', 'Emploi du temps'));
  sec.append(el('p', 'hint', 'Le fichier .ics donne les horaires de tes cours. Cartable OS reste ouvert du premier au dernier cours de la journée, et ouvre le dossier de chaque matière quand son cours commence.'));
  const row = el('div', 'row');
  const main = el('div', 'row-main');
  main.append(el('div', 'row-title', s.loaded ? `${s.courseCount} cours · ${s.subjects.length} matière${s.subjects.length > 1 ? 's' : ''}` : 'Aucun emploi du temps'));
  row.append(main);
  const actions = el('div', 'row-actions');
  const imp = el('button', 'btn btn-soft btn-sm', s.loaded ? 'Remplacer' : 'Choisir un fichier .ics');
  imp.type = 'button';
  imp.addEventListener('click', importSchedule);
  actions.append(imp);
  if (s.loaded) {
    const rm = el('button', 'btn btn-ghost btn-sm', 'Retirer');
    rm.type = 'button';
    rm.addEventListener('click', async () => { await api.clearSchedule(); toast('Emploi du temps retiré.'); });
    actions.append(rm);
  }
  row.append(actions);
  sec.append(row);
  return sec;
}

function sectionFolders() {
  const sec = el('section', 'sec');
  sec.append(el('h3', '', 'Dossiers des matières'));
  sec.append(el('p', 'hint', 'Chaque matière a son dossier. Il est créé tout seul dans le dossier principal ; tu peux en choisir un autre pour une matière.'));
  const root = el('div', 'row');
  const m = el('div', 'row-main');
  m.append(el('div', 'row-title', 'Dossier principal'), el('div', 'row-sub', state.settings.rootFolder));
  root.append(m);
  const ch = el('button', 'btn btn-soft btn-sm', 'Changer');
  ch.type = 'button';
  ch.addEventListener('click', () => api.pickRoot());
  root.append(ch);
  sec.append(root);
  state.schedule.subjects.forEach((s) => {
    const r = el('div', 'row');
    const mm = el('div', 'row-main');
    mm.append(el('div', 'row-title', s.name), el('div', 'row-sub', s.folder));
    r.append(mm);
    const a = el('div', 'row-actions');
    const open = el('button', 'btn btn-soft btn-sm', 'Ouvrir');
    open.type = 'button';
    open.addEventListener('click', async () => { const x = await api.openFolder(s.name); if (x && !x.ok) toast('Impossible d\'ouvrir le dossier.', true); });
    const change = el('button', 'btn btn-ghost btn-sm', 'Changer');
    change.type = 'button';
    change.addEventListener('click', () => api.pickSubjectFolder(s.name));
    a.append(open, change);
    if (s.custom) {
      const reset = el('button', 'btn btn-ghost btn-sm', 'Par défaut');
      reset.type = 'button';
      reset.addEventListener('click', () => api.resetSubjectFolder(s.name));
      a.append(reset);
    }
    r.append(a);
    sec.append(r);
  });
  return sec;
}

function appForm(app) {
  const form = el('div', app ? 'row-form' : 'add-box');
  const nameF = el('div', 'field');
  nameF.append(el('label', '', 'Nom'));
  const name = el('input', 'input');
  name.type = 'text';
  name.maxLength = 40;
  name.value = app ? app.name : '';
  name.disabled = !!(app && app.builtin);
  nameF.append(name);
  const tF = el('div', 'field');
  tF.append(el('label', '', 'Chemin du logiciel, nom de commande ou adresse web'));
  const ir = el('div', 'input-row');
  const target = el('input', 'input');
  target.type = 'text';
  target.maxLength = 1000;
  target.placeholder = 'C:\\Program Files\\…\\logiciel.exe  ou  https://…';
  target.value = app ? app.target : '';
  const pick = el('button', 'btn btn-soft btn-sm', 'Parcourir');
  pick.type = 'button';
  pick.addEventListener('click', async () => { const p = await api.pickAppTarget(); if (p) target.value = p; });
  ir.append(target, pick);
  tF.append(ir);
  const err = el('p', 'msg-err');
  err.hidden = true;
  const actions = el('div', 'form-actions');
  const save = el('button', 'btn btn-primary btn-sm', app ? 'Enregistrer' : 'Ajouter');
  save.type = 'button';
  const cancel = el('button', 'btn btn-ghost btn-sm', 'Annuler');
  cancel.type = 'button';
  cancel.addEventListener('click', () => { editingId = null; addingApp = false; renderDrawer(); });
  save.addEventListener('click', async () => {
    const r = app ? await api.updateApp(app.id, name.value, target.value) : await api.addApp(name.value, target.value);
    if (r && r.ok) { editingId = null; addingApp = false; toast(app ? 'Application modifiée.' : 'Application ajoutée.'); return; }
    err.hidden = false;
    err.textContent = r && r.reason === 'name' ? 'Donne un nom à cette application.'
      : r && r.reason === 'full' ? 'Tu as atteint le maximum d\'applications.'
        : 'Ce chemin n\'est pas valide. Utilise un chemin complet (C:\\…), un nom comme « winword » ou une adresse https://.';
  });
  actions.append(save, cancel);
  form.append(nameF, tF, err, actions);
  return form;
}

function sectionApps() {
  const sec = el('section', 'sec');
  sec.append(el('h3', '', 'Applications'));
  sec.append(el('p', 'hint', 'Les applications de l\'écran d\'accueil. Ajoute les logiciels ou les sites dont tu as besoin au collège.'));
  state.apps.forEach((a) => {
    if (editingId === a.id) { const w = el('div', 'row'); w.append(appForm(a)); w.firstChild.classList.add('row-main'); sec.append(w); return; }
    const r = el('div', 'row');
    r.append(appIcon(a, 'mini-icon'));
    const m = el('div', 'row-main');
    m.append(el('div', 'row-title', a.name), el('div', 'row-sub', a.fixed ? (a.note || 'Installé avec Cartable OS') : a.target));
    r.append(m);
    if (!a.fixed) {
      const acts = el('div', 'row-actions');
      const ed = el('button', 'btn btn-soft btn-sm', 'Modifier');
      ed.type = 'button';
      ed.addEventListener('click', () => { editingId = a.id; addingApp = false; renderDrawer(); });
      acts.append(ed);
      if (!a.builtin) {
        const rm = el('button', 'btn btn-ghost btn-sm', 'Retirer');
        rm.type = 'button';
        rm.addEventListener('click', () => api.removeApp(a.id));
        acts.append(rm);
      }
      r.append(acts);
    }
    sec.append(r);
  });
  if (addingApp) sec.append(appForm(null));
  else {
    const add = el('button', 'btn btn-soft', 'Ajouter une application');
    add.type = 'button';
    add.style.marginTop = '12px';
    add.addEventListener('click', () => { addingApp = true; editingId = null; renderDrawer(); });
    sec.append(add);
  }
  return sec;
}

function sectionSession() {
  const sec = el('section', 'sec');
  sec.append(el('h3', '', 'Session'));
  sec.append(toggleRow('Empêcher la fermeture pendant les cours', 'Cartable OS reste ouvert du premier au dernier cours. Désactive pour pouvoir le fermer à tout moment.', state.settings.lockDuringSession, (v) => api.setSetting('lockDuringSession', v)));
  sec.append(toggleRow('Démarrer avec Windows', 'Pour qu\'il s\'ouvre tout seul au début des cours, même si l\'ordinateur vient d\'être allumé.', state.settings.openAtLogin, (v) => api.setSetting('openAtLogin', v)));
  return sec;
}

function sectionQuit() {
  const sec = el('section', 'sec');
  const row = el('div', 'row');
  const m = el('div', 'row-main');
  m.append(el('div', 'row-title', 'Quitter Cartable OS'), el('div', 'row-sub', state.locked ? 'Impossible pendant les cours (voir Session ci-dessus).' : `Version ${state.version}. Il ne suivra plus l'emploi du temps tant qu'il est fermé.`));
  const q = el('button', 'btn btn-danger btn-sm', 'Quitter');
  q.type = 'button';
  q.disabled = state.locked;
  q.addEventListener('click', () => api.quit());
  row.append(m, q);
  sec.append(row);
  return sec;
}

function renderDrawer() {
  if (!drawerOpen || !state) return;
  const body = $('drawerBody');
  const top = body.scrollTop;
  body.textContent = '';
  body.append(sectionScheduleSettings(), sectionFolders(), sectionApps(), sectionSession(), sectionQuit());
  body.scrollTop = top;
}

function openDrawer() { drawerOpen = true; $('drawer').hidden = false; $('scrim').hidden = false; renderDrawer(); }
function closeDrawer() { drawerOpen = false; editingId = null; addingApp = false; $('drawer').hidden = true; $('scrim').hidden = true; }

async function importSchedule() {
  const r = await api.importSchedule();
  if (!r || r.reason === 'canceled') return;
  if (r.ok) { toast(`${r.courses} cours importés, ${r.subjects} matière${r.subjects > 1 ? 's' : ''}. Les dossiers sont prêts.`); return; }
  const why = { empty: 'Ce fichier ne contient aucun cours.', big: 'Ce fichier est trop gros pour un emploi du temps.', read: 'Impossible de lire ce fichier.', write: 'Impossible d\'enregistrer l\'emploi du temps.' };
  toast(why[r.reason] || 'Import impossible.', true);
}

// ---------- Mise en route ----------
function renderAll() {
  if (!state) return;
  $('winBtns').hidden = state.locked;
  const embedded = !!(state.devoirs && state.devoirs.embedded);
  $('btnHome').hidden = !embedded;
  $('crumbHere').hidden = !embedded;
  renderNow();
  renderDay();
  updateDayLive();
  renderApps();
  renderDevoirs();
  renderDrawer();
}

function init() {
  hydrateIcons();
  renderClock();
  // Les réglages s'ouvrent sur l'accueil : si Mes Devoirs est ouvert dans Cartable OS, on revient d'abord à l'accueil
  $('openSettings').addEventListener('click', () => { if (state && state.devoirs && state.devoirs.embedded) api.closeDevoirsEmbedded(); openDrawer(); });
  $('btnHome').addEventListener('click', () => api.closeDevoirsEmbedded());
  $('closeSettings').addEventListener('click', closeDrawer);
  $('scrim').addEventListener('click', closeDrawer);
  // Le bouton du panneau ouvre Mes Devoirs dans Cartable OS (le logiciel à part a son propre raccourci)
  $('dvOpen').addEventListener('click', async () => { const r = await api.openDevoirsEmbedded(); if (r && !r.ok) toast(REASONS[r.reason] || 'Impossible d\'ouvrir Mes Devoirs.', true); });
  $('btnMin').addEventListener('click', () => api.minimize());
  $('btnHide').addEventListener('click', () => api.hide());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawerOpen) closeDrawer(); });

  api.onState((s) => { state = s; renderAll(); });
  api.getState().then((s) => { state = s; renderAll(); });

  // L'heure et la position dans la frise avancent toutes les secondes sans attendre le programme principal
  setInterval(() => { renderClock(); updateDayLive(); }, 1000);
}

init();
