'use strict';

// Petites améliorations d'interface (aucune donnée n'est touchée) :
//  - classe « mac » pour la barre de titre intégrée,
//  - menu latéral repliable (bouton ou Ctrl/⌘+B), choix mémorisé,
//  - formulaire « Nouveau devoir » : la section « Plus de détails » s'ouvre toute seule
//    quand le devoir a déjà des notes, des étapes, des étiquettes ou des fichiers.
(function () {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible : pas grave */ } },
  };

  if (/Mac/i.test(navigator.platform || '') || /Macintosh/i.test(navigator.userAgent)) root.classList.add('mac');

  // ---------- Menu latéral repliable ----------
  const app = document.querySelector('.app');
  const btn = $('collapseBtn');
  const KEY = 'mesdevoirs.sidebarCollapsed';

  function labelFilters() {
    // Menu réduit : les libellés disparaissent, on les garde en infobulle
    document.querySelectorAll('.filters button, .side-foot > .nav-btn').forEach((b) => {
      const lbl = b.querySelector('.lbl');
      if (lbl && !b.title) b.title = lbl.textContent.trim();
    });
  }

  function setCollapsed(on, save) {
    if (!app || !btn) return;
    app.classList.toggle('collapsed', on);
    btn.setAttribute('aria-expanded', String(!on));
    const t = on ? 'Agrandir le menu (Ctrl+B)' : 'Réduire le menu (Ctrl+B)';
    btn.title = t;
    btn.setAttribute('aria-label', on ? 'Agrandir le menu' : 'Réduire le menu');
    if (on) labelFilters();
    if (save) store.set(KEY, on ? '1' : '0');
  }

  if (btn) {
    btn.addEventListener('click', () => setCollapsed(!app.classList.contains('collapsed'), true));
    setCollapsed(store.get(KEY) === '1', false);
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed(!app.classList.contains('collapsed'), true);
      }
    });
  }

  // ---------- Formulaire : « Plus de détails » ----------
  const dlg = $('dialog');
  const more = $('f-more');
  const dot = $('f-more-dot');

  function hasExtras() {
    const filled = (id) => { const n = $(id); return !!n && n.children.length > 0; };
    return !!($('f-notes') && $('f-notes').value.trim()) || filled('f-subs') || filled('f-tags') || filled('f-files');
  }

  function syncMore(reset) {
    if (!more) return;
    const extra = hasExtras();
    if (reset) more.open = extra;
    if (dot) dot.hidden = !extra || more.open;
  }

  if (dlg && more) {
    // Le formulaire est rempli avant showModal() : on regarde juste après l'ouverture
    new MutationObserver(() => {
      if (dlg.open) requestAnimationFrame(() => syncMore(true));
    }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
    more.addEventListener('toggle', () => syncMore(false));
  }
}());
