'use strict';

// Onglet « Notes /20 » : toutes tes notes, les moyennes par matière et la moyenne générale.
// - Les notes saisies ici sont rangées dans les réglages (state.settings.grades) : elles partent avec les sauvegardes.
// - Les notes des contrôles et exposés (saisies dans un devoir) sont reprises automatiquement dans la liste.
// - Toutes les notes sont ramenées sur 20 ; la moyenne d'une matière tient compte des coefficients,
//   la moyenne générale est la moyenne des matières (comme dans les Statistiques).
// Ce fichier est chargé après notes.js et utilise renderer.js (state, $, el, button, mkIcon, uid, persist, pushUndo…).
(function () {
  const content = document.querySelector('.content');
  const page = $('gradesPage');
  const navBtn = $('gradesBtn');
  const dlg = $('gradeDlg');
  let isOpen = false;
  let editingId = null;

  // ---------- Données ----------
  function clean() {
    const raw = Array.isArray(state.settings.grades) ? state.settings.grades : [];
    const seen = new Set();
    state.settings.grades = raw
      .filter((g) => g && typeof g === 'object' && Number.isFinite(Number(g.grade)))
      .map((g) => {
        let id = typeof g.id === 'string' && g.id ? g.id : uid();
        while (seen.has(id)) id = uid();
        seen.add(id);
        const max = Number(g.max) > 0 ? Math.min(1000, Number(g.max)) : 20;
        return {
          id,
          subject: typeof g.subject === 'string' ? g.subject.slice(0, 60) : '',
          title: typeof g.title === 'string' ? g.title.slice(0, 120) : '',
          grade: Math.max(0, Math.min(1500, Number(g.grade))),
          max,
          coef: Number(g.coef) > 0 ? Math.min(100, Number(g.coef)) : 1,
          date: /^\d{4}-\d{2}-\d{2}$/.test(String(g.date || '')) ? g.date : '',
          comment: typeof g.comment === 'string' ? g.comment.slice(0, 500) : '',
          created: Number.isFinite(g.created) ? g.created : Date.now(),
        };
      });
  }
  const list = () => state.settings.grades;
  const find = (id) => list().find((g) => g.id === id) || null;

  const fmt = (n) => Number(n).toLocaleString(LOCALE, { maximumFractionDigits: 2 });
  const on20 = (e) => (e.grade / e.max) * 20;
  function fmtDate(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-').map(Number);
    const sameYear = y === new Date().getFullYear();
    return new Date(y, m - 1, d).toLocaleDateString(LOCALE, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const level = (avg) => (avg < 10 ? 'bad' : avg < 12 ? 'mid' : avg < 14 ? 'ok' : 'good');

  // Notes saisies ici + notes des contrôles / exposés
  function entries() {
    const own = list().map((g) => Object.assign({ own: true, editable: true }, g));
    const fromHw = statsPool()
      .filter((h) => typeof h.grade === 'number')
      .map((h) => ({
        id: h.id, own: false, editable: state.homework.some((x) => x.id === h.id), subject: (h.subject || '').trim(), title: h.title,
        grade: h.grade, max: h.gradeMax > 0 ? h.gradeMax : 20, coef: h.coef > 0 ? h.coef : 1, date: h.date || '', comment: '',
      }));
    return own.concat(fromHw);
  }

  // Regroupe par matière : moyenne pondérée sur 20 ; moyenne générale = moyenne des matières
  function compute() {
    const all = entries();
    const groups = new Map();
    all.forEach((e) => {
      const sub = findSubject(e.subject);
      const name = sub ? sub.name : (e.subject || '').trim();
      const key = name.toLowerCase();
      if (!groups.has(key)) groups.set(key, { name, items: [], sum: 0, coef: 0 });
      const g = groups.get(key);
      g.items.push(e);
      g.sum += on20(e) * e.coef;
      g.coef += e.coef;
    });
    const order = state.settings.subjects.map((s) => s.name.toLowerCase());
    const rows = [...groups.values()].map((g) => {
      g.avg = g.sum / g.coef;
      g.items.sort((a, b) => (b.date || '').localeCompare(a.date || '') || 0);
      return g;
    }).sort((a, b) => {
      if (!a.name !== !b.name) return a.name ? -1 : 1; // « Sans matière » en dernier
      const ia = order.indexOf(a.name.toLowerCase());
      const ib = order.indexOf(b.name.toLowerCase());
      if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
      return a.name.localeCompare(b.name, LOCALE);
    });
    const general = rows.length ? rows.reduce((s, r) => s + r.avg, 0) / rows.length : null;
    const dated = all.filter((e) => e.date).sort((a, b) => a.date.localeCompare(b.date));
    return { all, rows, general, dated };
  }

  // ---------- Affichage ----------
  function tile(label, value, sub, cls) {
    const t = el('div', 'g-tile' + (cls ? ' ' + cls : ''));
    t.append(el('span', 'g-tl', label));
    const v = el('span', 'g-tv', value);
    if (sub && sub.user) v.dataset.notr = '';
    t.append(v);
    if (sub) { const s = el('span', 'g-ts', sub.text !== undefined ? sub.text : sub); if (sub.user) s.dataset.notr = ''; t.append(s); }
    return t;
  }

  function renderTiles(c) {
    const box = $('gTiles');
    box.textContent = '';
    if (!c.all.length) return;
    box.append(tile('Moyenne générale', c.general === null ? '—' : `${fmt(c.general)}/20`, c.rows.length > 1 ? 'Moyenne des matières' : '', 'g-' + level(c.general)));
    const sorted = c.rows.slice().sort((a, b) => b.avg - a.avg);
    const best = sorted[0];
    box.append(tile('Meilleure matière', best.name || 'Sans matière', { text: `${fmt(best.avg)}/20`, user: !!best.name }));
    if (sorted.length > 1) {
      const worst = sorted[sorted.length - 1];
      box.append(tile('À améliorer', worst.name || 'Sans matière', { text: `${fmt(worst.avg)}/20`, user: !!worst.name }));
    }
    const last = c.dated[c.dated.length - 1];
    if (last) box.append(tile('Dernière note', `${fmt(on20(last))}/20`, { text: last.title || fmtDate(last.date), user: !!last.title }));
  }

  // Courbe de toutes les notes (sur 20) dans l'ordre des dates, avec la moyenne générale en pointillés
  function renderChart(c) {
    const box = $('gChart');
    box.textContent = '';
    box.hidden = c.dated.length < 2;
    if (box.hidden) return;
    const NS = 'http://www.w3.org/2000/svg';
    const W = 640, H = 190, L = 30, R = 12, T = 12, B = 24;
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', 'Évolution de tes notes sur 20');
    const mk = (tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
      if (text !== undefined) n.textContent = text;
      return n;
    };
    const y = (v) => T + (1 - Math.max(0, Math.min(20, v)) / 20) * (H - T - B);
    const pts = c.dated.length;
    const x = (i) => L + (pts === 1 ? 0.5 : i / (pts - 1)) * (W - L - R);
    [0, 5, 10, 15, 20].forEach((v) => {
      s.append(mk('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v === 10 ? 'g-grid mid' : 'g-grid' }));
      s.append(mk('text', { x: L - 6, y: y(v) + 4, class: 'g-axis', 'text-anchor': 'end' }, String(v)));
    });
    if (c.general !== null) s.append(mk('line', { x1: L, x2: W - R, y1: y(c.general), y2: y(c.general), class: 'g-avgline' }));
    s.append(mk('polyline', { points: c.dated.map((e, i) => `${x(i)},${y(on20(e))}`).join(' '), class: 'g-line', fill: 'none' }));
    c.dated.forEach((e, i) => {
      const dot = mk('circle', { cx: x(i), cy: y(on20(e)), r: 4.5, class: 'g-dot ' + level(on20(e)) });
      dot.append(mk('title', {}, `${e.title || 'Note'} · ${fmtDate(e.date)} · ${fmt(on20(e))}/20`));
      s.append(dot);
    });
    s.append(mk('text', { x: L, y: H - 6, class: 'g-axis' }, fmtDate(c.dated[0].date)));
    s.append(mk('text', { x: W - R, y: H - 6, class: 'g-axis', 'text-anchor': 'end' }, fmtDate(c.dated[pts - 1].date)));
    const h = el('h3', null, 'Évolution des notes');
    box.append(h, s);
  }

  function gradeRow(e) {
    const li = el('li', 'g-row');
    li.append(el('span', 'g-date', fmtDate(e.date)));
    const main = el('div', 'g-main');
    const t = el('span', 'g-title' + (e.title ? '' : ' ph'), e.title || (e.own ? 'Note' : 'Sans titre'));
    if (e.title) t.dataset.notr = '';
    main.append(t);
    if (!e.own) main.append(el('span', 'g-badge', 'Devoir'));
    if (e.comment) { const cm = el('div', 'g-comment', e.comment); cm.dataset.notr = ''; main.append(cm); }
    li.append(main);
    if (e.coef !== 1) li.append(el('span', 'g-coef', `coef ${fmt(e.coef)}`));
    const v = on20(e);
    const val = el('span', 'g-val ' + level(v));
    val.append(el('b', null, e.max === 20 ? `${fmt(e.grade)}/20` : `${fmt(e.grade)}/${fmt(e.max)}`));
    if (e.max !== 20) val.append(el('small', null, `= ${fmt(v)}/20`));
    li.append(val);
    if (e.editable) {
      const b = button('icon-btn tiny');
      b.append(mkIcon('edit'));
      b.title = e.own ? 'Modifier la note' : 'Modifier le devoir';
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', () => (e.own ? openEditor(e.id) : openDialog(e.id)));
      li.append(b);
    } else li.append(el('span', 'g-nobtn'));
    return li;
  }

  function renderSubjects(c) {
    const box = $('gSubjects');
    box.textContent = '';
    c.rows.forEach((g) => {
      const sec = el('section', 'g-sub');
      const head = el('header', 'g-sub-head');
      const name = el('span', 'g-sub-name', g.name || 'Sans matière');
      if (g.name) name.dataset.notr = '';
      name.style.setProperty('--c', subjectColor(g.name));
      name.prepend(el('span', 'dot'));
      // « 3 notes » est déjà traduit « 3 notes » par le carnet de notes : ici on écrit le bon mot selon la langue
      const cnt = el('span', 'g-sub-n', LOCALE.startsWith('en') ? `${g.items.length} grade${g.items.length > 1 ? 's' : ''}` : `${g.items.length} note${g.items.length > 1 ? 's' : ''}`);
      cnt.dataset.notr = '';
      head.append(name, cnt);
      const avg = el('span', 'g-avg ' + level(g.avg));
      avg.append(el('b', null, fmt(g.avg)), el('small', null, '/20'));
      head.append(avg);
      const bar = el('div', 'g-bar');
      const fill = el('span', level(g.avg));
      fill.style.width = `${Math.max(0, Math.min(1, g.avg / 20)) * 100}%`;
      bar.append(fill);
      const ul = el('ul', 'g-list');
      g.items.forEach((e) => ul.append(gradeRow(e)));
      sec.append(head, bar, ul);
      box.append(sec);
    });
  }

  function updateCount() {
    const c = compute();
    $('c-grades').textContent = c.general === null ? '–' : fmt(Math.round(c.general * 10) / 10);
    return c;
  }

  function renderAll() {
    const c = updateCount();
    const n = c.all.length;
    $('gradesSub').textContent = n === 0 ? 'Aucune note' : `${n} note${n > 1 ? 's' : ''} · ${c.rows.length} matière${c.rows.length > 1 ? 's' : ''}`;
    $('gEmpty').hidden = n > 0;
    renderTiles(c);
    renderChart(c);
    renderSubjects(c);
  }

  // ---------- Ajouter / modifier une note ----------
  const subjectSel = $('g-subject');
  function fillSubjects(selected) {
    subjectSel.textContent = '';
    const none = el('option', null, '— Aucune —');
    none.value = '';
    subjectSel.append(none);
    const names = state.settings.subjects.map((s) => s.name);
    if (selected && !names.some((n) => sameName(n, selected))) names.push(selected);
    names.forEach((n) => { const o = el('option', null, n); o.value = n; o.dataset.notr = ''; subjectSel.append(o); });
    const hit = names.find((n) => sameName(n, selected));
    subjectSel.value = hit || '';
  }

  function updatePreview() {
    const v = $('g-value').value.trim();
    const max = Number($('g-max').value) > 0 ? Number($('g-max').value) : 20;
    const p = $('g-preview');
    if (v === '' || !Number.isFinite(Number(v))) { p.textContent = ''; return; }
    const n20 = (Number(v) / max) * 20;
    p.className = 'g-preview ' + level(n20);
    p.textContent = max === 20 ? `${fmt(n20)}/20` : `= ${fmt(n20)}/20`;
  }

  function openEditor(id, presetSubject) {
    editingId = id || null;
    const g = id ? find(id) : null;
    $('gradeDlgTitle').textContent = g ? 'Modifier la note' : 'Ajouter une note';
    fillSubjects(g ? g.subject : (presetSubject || ''));
    $('g-title').value = g ? g.title : '';
    $('g-value').value = g ? g.grade : '';
    $('g-max').value = g && g.max !== 20 ? g.max : '';
    $('g-coef').value = g && g.coef !== 1 ? g.coef : '';
    $('g-date').value = g ? g.date : todayStr();
    $('g-comment').value = g ? g.comment : '';
    $('g-error').hidden = true;
    $('g-delete').hidden = !g;
    updatePreview();
    dlg.showModal();
    $('g-value').focus();
  }

  $('gradeForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const err = (t) => { const e = $('g-error'); e.textContent = t; e.hidden = false; };
    const raw = $('g-value').value.trim().replace(',', '.');
    const grade = Number(raw);
    const max = $('g-max').value.trim() === '' ? 20 : Number($('g-max').value);
    const coef = $('g-coef').value.trim() === '' ? 1 : Number($('g-coef').value);
    if (raw === '' || !Number.isFinite(grade) || grade < 0) { err('Entre la note obtenue (un nombre positif).'); $('g-value').focus(); return; }
    if (!(max > 0) || max > 1000) { err('La note maximale doit être supérieure à 0.'); $('g-max').focus(); return; }
    if (grade > max * 1.25) { err(`La note ne peut pas dépasser ${fmt(max * 1.25)} (sur ${fmt(max)} avec un éventuel bonus).`); $('g-value').focus(); return; }
    if (!(coef > 0) || coef > 100) { err('Le coefficient doit être supérieur à 0.'); $('g-coef').focus(); return; }
    const data = {
      subject: subjectSel.value, title: $('g-title').value.trim().slice(0, 120), grade, max, coef,
      date: $('g-date').value || todayStr(), comment: $('g-comment').value.trim().slice(0, 500),
    };
    const existing = editingId ? find(editingId) : null;
    if (existing) Object.assign(existing, data);
    else list().push(Object.assign({ id: uid(), created: Date.now() }, data));
    persist();
    dlg.close();
    render();
    showToast(existing ? 'Note modifiée' : 'Note ajoutée');
  });

  $('g-delete').addEventListener('click', () => {
    const g = editingId ? find(editingId) : null;
    if (!g) return;
    if (state.settings.confirmDelete && !confirm(g.title ? `Supprimer « ${g.title} » ?` : 'Supprimer cette note ?')) return;
    state.settings.grades = list().filter((x) => x.id !== g.id);
    persist();
    dlg.close();
    render();
    pushUndo('Note supprimée', () => { list().push(g); });
  });
  $('g-cancel').addEventListener('click', () => dlg.close());
  $('g-close').addEventListener('click', () => dlg.close());
  ['g-value', 'g-max'].forEach((id) => $(id).addEventListener('input', updatePreview));

  $('gradeNew').addEventListener('click', () => openEditor(null));
  $('gradeEmptyNew').addEventListener('click', () => openEditor(null));

  // ---------- Ouvrir / quitter l'onglet ----------
  function show() {
    if (isOpen) return;
    if (window.notes) window.notes.close();
    isOpen = true;
    content.classList.add('grades-mode');
    page.hidden = false;
    navBtn.classList.add('active');
    navBtn.setAttribute('aria-current', 'page');
    document.querySelectorAll('#filters button').forEach((b) => b.classList.remove('active'));
    renderAll();
  }
  function hide() {
    if (!isOpen) return;
    isOpen = false;
    content.classList.remove('grades-mode');
    page.hidden = true;
    navBtn.classList.remove('active');
    navBtn.removeAttribute('aria-current');
    document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('active', b.dataset.filter === state.filter));
  }
  navBtn.addEventListener('click', show);
  // Un clic sur un filtre, une matière ou l'onglet Notes ramène ailleurs (phase de capture : on quitte avant que l'autre s'ouvre)
  const leave = (e) => { if (e.target.closest('button')) hide(); };
  $('filters').addEventListener('click', leave, true);
  $('subjectList').addEventListener('click', leave, true);
  $('notesBtn').addEventListener('click', hide, true);

  function init() { clean(); updateCount(); }
  function refresh() { clean(); if (isOpen) renderAll(); else updateCount(); }
  // Appelé à chaque render() de l'appli : met à jour le compteur et la page si elle est ouverte
  function render() { if (isOpen) renderAll(); else updateCount(); }

  window.grades = { init, refresh, render, open: show, close: hide, add: () => { show(); openEditor(null); }, isOpen: () => isOpen, entries, compute };
}());
