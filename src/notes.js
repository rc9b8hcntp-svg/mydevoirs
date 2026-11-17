'use strict';

// Onglet « Notes » : un carnet de notes libres (titre + texte), séparé des devoirs.
// Les notes sont rangées dans les réglages (state.settings.notes) : elles sont enregistrées avec le reste
// des données et partent aussi dans les sauvegardes.
// Ce fichier est chargé après extras.js et utilise renderer.js (state, $, el, button, uid, persist, pushUndo…).
(function () {
  const MAX_TITLE = 120;
  const MAX_TEXT = 20000;
  const content = document.querySelector('.content');
  const page = $('notesPage');
  const navBtn = $('notesBtn');
  const searchIn = $('noteSearch');
  const titleIn = $('noteTitle');
  const bodyIn = $('noteBody');

  let isOpen = false;
  let currentId = null;
  let listTimer = null;

  // ---------- Données ----------
  // Remet les notes au propre (fichier modifié à la main, ancienne version, import…)
  function clean() {
    const raw = Array.isArray(state.settings.notes) ? state.settings.notes : [];
    const seen = new Set();
    state.settings.notes = raw
      .filter((n) => n && typeof n === 'object')
      .map((n) => {
        let id = typeof n.id === 'string' && n.id ? n.id : uid();
        while (seen.has(id)) id = uid();
        seen.add(id);
        const created = Number.isFinite(n.created) ? n.created : Date.now();
        return {
          id,
          title: typeof n.title === 'string' ? n.title.slice(0, MAX_TITLE) : '',
          text: typeof n.text === 'string' ? n.text.slice(0, MAX_TEXT) : '',
          created,
          modified: Number.isFinite(n.modified) ? n.modified : created,
        };
      });
  }

  const list = () => state.settings.notes;
  const find = (id) => list().find((n) => n.id === id) || null;
  const isBlank = (n) => !n.title.trim() && !n.text.trim();
  const byRecent = (a, b) => b.modified - a.modified;
  const total = () => list().filter((n) => !isBlank(n)).length;

  // Notes affichées dans la liste (les plus récentes d'abord, filtrées par la recherche)
  function visible() {
    const words = normTxt(searchIn.value.trim()).split(/\s+/).filter(Boolean);
    return list().slice().sort(byRecent).filter((n) => {
      if (!words.length) return true;
      const text = normTxt(`${n.title}\n${n.text}`);
      return words.every((w) => text.includes(w));
    });
  }

  // Une note encore vide n'est jamais gardée : on la retire quand on passe à autre chose
  function pruneEmpty(keepId) {
    const kept = list().filter((n) => n.id === keepId || !isBlank(n));
    if (kept.length !== list().length) { state.settings.notes = kept; persist(); }
  }

  // ---------- Dates ----------
  function fmtShort(t) {
    const d = new Date(t);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
    const sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString(LOCALE, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const fmtFull = (t) => new Date(t).toLocaleString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ---------- Affichage ----------
  function updateCount() {
    const n = total();
    $('c-notes').textContent = n;
    $('notesSub').textContent = n === 0 ? 'Aucune note' : `${n} note${n > 1 ? 's' : ''}`;
  }

  function renderList() {
    const ul = $('noteList');
    ul.textContent = '';
    const items = visible();
    if (!items.length) {
      if (searchIn.value.trim()) ul.append(el('li', 'note-none', 'Aucun résultat.'));
      return;
    }
    items.forEach((n) => {
      const on = n.id === currentId;
      const b = button('note-item' + (on ? ' on' : ''));
      b.dataset.id = n.id;
      if (on) b.setAttribute('aria-current', 'true');

      // Le texte écrit par l'utilisateur n'est jamais traduit (data-notr) ; les libellés par défaut le sont
      const title = n.title.trim();
      const tEl = el('span', 'n-title' + (title ? '' : ' ph'), title || 'Sans titre');
      if (title) tEl.dataset.notr = '';
      const first = n.text.split('\n').map((l) => l.trim()).find(Boolean) || '';
      const pEl = el('span', 'n-prev' + (first ? '' : ' ph'), first ? first.slice(0, 120) : 'Note vide');
      if (first) pEl.dataset.notr = '';

      b.append(tEl, pEl, el('span', 'n-date', fmtShort(n.modified)));
      b.addEventListener('click', () => select(n.id));
      const li = el('li');
      li.append(b);
      ul.append(li);
    });
  }

  function renderWhen(n) {
    const w = $('noteWhen');
    w.textContent = '';
    w.append(el('span', null, 'Modifiée'), ' ', el('time', null, fmtFull(n.modified)));
  }

  // fill = true : on recopie la note dans les champs (changement de note) ; sinon on ne touche pas au texte en cours de saisie
  function renderEditor(fill) {
    const n = currentId ? find(currentId) : null;
    $('noteForm').hidden = !n;
    $('noteEmpty').hidden = !!n;
    if (!n) {
      const none = total() === 0;
      $('noteEmptyTitle').textContent = none ? "Aucune note pour l'instant." : 'Choisis une note, ou crée-en une nouvelle.';
      $('noteEmptyHint').textContent = none ? 'Crée ta première note avec « Nouvelle note ».' : '';
      return;
    }
    if (fill) { titleIn.value = n.title; bodyIn.value = n.text; }
    renderWhen(n);
  }

  function renderAll(fill) {
    renderList();
    renderEditor(fill);
    updateCount();
  }

  // Pendant la frappe, la liste est mise à jour juste après (pas à chaque touche)
  function scheduleList() {
    clearTimeout(listTimer);
    listTimer = setTimeout(() => { renderList(); updateCount(); }, 150);
  }

  // ---------- Actions ----------
  function select(id) {
    clearTimeout(listTimer);
    currentId = id;
    pruneEmpty(id);
    renderAll(true);
  }

  function newNote() {
    searchIn.value = '';
    let n = list().find(isBlank); // une note vide déjà ouverte est réutilisée
    if (!n) {
      const now = Date.now();
      n = { id: uid(), title: '', text: '', created: now, modified: now };
      list().push(n);
    }
    clearTimeout(listTimer);
    currentId = n.id;
    pruneEmpty(n.id);
    renderAll(true);
    titleIn.focus();
  }

  function removeNote() {
    const n = currentId ? find(currentId) : null;
    if (!n) return;
    const hasText = !isBlank(n);
    if (hasText && state.settings.confirmDelete) {
      const name = n.title.trim();
      if (!confirm(name ? `Supprimer « ${name} » ?` : 'Supprimer cette note ?')) return;
    }
    const order = visible();
    const i = order.findIndex((x) => x.id === n.id);
    const next = order[i + 1] || order[i - 1] || null;
    clearTimeout(listTimer);
    state.settings.notes = list().filter((x) => x.id !== n.id);
    currentId = next ? next.id : null;
    persist();
    renderAll(true);
    if (hasText) {
      pushUndo('Note supprimée', () => {
        list().push(n);
        currentId = n.id;
        renderAll(true);
      });
    }
  }

  function edited() {
    const n = currentId ? find(currentId) : null;
    if (!n) return null;
    n.modified = Date.now();
    persist();
    renderWhen(n);
    scheduleList();
    return n;
  }

  titleIn.addEventListener('input', () => { const n = currentId && find(currentId); if (n) { n.title = titleIn.value.slice(0, MAX_TITLE); edited(); } });
  bodyIn.addEventListener('input', () => { const n = currentId && find(currentId); if (n) { n.text = bodyIn.value.slice(0, MAX_TEXT); edited(); } });
  // Entrée dans le titre : on passe directement au texte
  titleIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); bodyIn.focus(); }
  });

  searchIn.addEventListener('input', () => { renderList(); });
  searchIn.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (searchIn.value) { searchIn.value = ''; renderList(); } else searchIn.blur();
  });

  $('noteNew').addEventListener('click', newNote);
  $('noteDel').addEventListener('click', removeNote);

  // ---------- Ouvrir / quitter l'onglet ----------
  function show() {
    if (isOpen) return;
    isOpen = true;
    content.classList.add('notes-mode');
    page.hidden = false;
    navBtn.classList.add('active');
    navBtn.setAttribute('aria-current', 'page');
    document.querySelectorAll('#filters button').forEach((b) => b.classList.remove('active'));
    if (!currentId || !find(currentId)) {
      const first = visible()[0];
      currentId = first ? first.id : null;
    }
    renderAll(true);
  }

  function hide() {
    if (!isOpen) return;
    isOpen = false;
    clearTimeout(listTimer);
    content.classList.remove('notes-mode');
    page.hidden = true;
    navBtn.classList.remove('active');
    navBtn.removeAttribute('aria-current');
    pruneEmpty(null);
    if (currentId && !find(currentId)) currentId = null;
    updateCount();
    // Le filtre du menu est remis en surbrillance (render() le refait aussi juste après)
    document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('active', b.dataset.filter === state.filter));
  }

  navBtn.addEventListener('click', show);

  // Un clic sur un filtre ou une matière du menu ramène à la liste des devoirs
  // (phase de capture : on quitte les notes avant que le filtre ne s'applique)
  const leave = (e) => { if (e.target.closest('button')) hide(); };
  $('filters').addEventListener('click', leave, true);
  $('subjectList').addEventListener('click', leave, true);

  // ---------- Branchement avec le reste de l'appli ----------
  function init() {
    clean();
    pruneEmpty(null); // notes laissées vides par une session précédente
    currentId = null;
    updateCount();
  }

  // Après un import de sauvegarde : on relit les notes sans déranger une saisie en cours
  function refresh() {
    clean();
    if (currentId && !find(currentId)) currentId = null;
    if (!isOpen) { updateCount(); return; }
    const n = currentId ? find(currentId) : null;
    renderAll(!n || n.title !== titleIn.value || n.text !== bodyIn.value);
  }

  window.notes = { init, refresh, open: show, close: hide, isOpen: () => isOpen };
}());
