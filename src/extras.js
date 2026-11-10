'use strict';

// Fonctions « Organisation » et « Confort » : modèles de devoirs, ajout rapide, corbeille, archive,
// import d'emploi du temps, mini-widget, code de verrouillage, synchronisation et langue.
// Ce fichier est chargé après renderer.js et en utilise les fonctions (state, $, el, render, persist…).
(function () {
  const DAY = 86400000;
  const TRASH_DAYS = 30;
  const api = window.devoirsAPI;
  const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
  const isEnglish = () => state.settings.language === 'en';

  // ---------- Modèles de devoirs ----------
  const DEFAULT_TEMPLATES = [
    { id: 'tpl-chapter', name: 'Lire un chapitre', title: 'Lire le chapitre …', subject: '', priority: 1, kind: '', minutes: 30,
      subtasks: ['Lire le chapitre', 'Noter les mots difficiles', 'Résumer en 3 phrases'] },
    { id: 'tpl-sheet', name: 'Fiche de révision', title: 'Fiche de révision : …', subject: '', priority: 1, kind: '', minutes: 45,
      subtasks: ['Relire le cours', 'Écrire les points clés', 'Se tester sans regarder'] },
    { id: 'tpl-exercises', name: 'Exercices', title: 'Exercices page …', subject: '', priority: 1, kind: '', minutes: 30, subtasks: [] },
    { id: 'tpl-test', name: 'Préparer un contrôle', title: 'Contrôle : …', subject: '', priority: 2, kind: 'controle', minutes: 60,
      subtasks: ['Relire le cours', 'Refaire les exercices', 'Apprendre les définitions', 'Faire un auto-test'] },
    { id: 'tpl-talk', name: 'Préparer un exposé', title: 'Exposé : …', subject: '', priority: 2, kind: 'expose', minutes: 90,
      subtasks: ['Chercher des informations', 'Écrire le plan', 'Préparer les diapositives', "S'entraîner à l'oral"] },
  ];
  const cloneTemplates = () => DEFAULT_TEMPLATES.map((t) => ({ ...t, subtasks: [...t.subtasks] }));
  const templates = () => state.settings.templates;

  // Les modèles fournis sont en français : en anglais, on les traduit au moment de les utiliser
  function tplText(t, text) {
    return isEnglish() && /^tpl-/.test(t.id) && window.I18N ? window.I18N.tr(text) : text;
  }

  function renderTemplateChips() {
    const box = $('f-templates');
    box.textContent = '';
    templates().forEach((t) => {
      const b = button('chip');
      b.style.setProperty('--c', 'var(--accent)');
      b.title = 'Remplir le formulaire avec ce modèle';
      b.append(el('span', 'dot'), t.name);
      b.addEventListener('click', () => applyTemplate(t));
      box.append(b);
    });
    if (!templates().length) box.append(el('span', 'muted', 'Aucun modèle : enregistre un devoir comme modèle (lien en bas du formulaire).'));
  }

  function applyTemplate(t) {
    if (!$('f-title').value.trim()) $('f-title').value = tplText(t, t.title || t.name);
    if (t.subject && findSubject(t.subject)) pickedSubject = t.subject;
    if (t.priority > 1) setPriority(t.priority);
    if (t.kind) setKind(t.kind);
    if (t.minutes) $('f-minutes').value = t.minutes;
    if (t.notes && !$('f-notes').value.trim()) $('f-notes').value = tplText(t, t.notes);
    if ((t.tags || []).length) addFormTags(t.tags.join(','));
    (t.subtasks || []).forEach((raw) => {
      const text = tplText(t, raw);
      if (formSubs.length < 30 && !formSubs.some((x) => x.text === text)) formSubs.push({ id: uid(), text, done: false });
    });
    renderPicker();
    renderFormSubs();
    $('f-title').focus();
  }

  function saveAsTemplate() {
    const title = $('f-title').value.trim();
    if (!title) { showToast("Écris d'abord un titre : il sert de nom au modèle."); $('f-title').focus(); return; }
    addFormSub();
    addFormTags($('f-tag-input').value);
    $('f-tag-input').value = '';
    const t = {
      id: uid(), name: title.slice(0, 60), title, subject: pickedSubject || '', priority: Number(pickedPriority) || 1, kind: pickedKind || '',
      minutes: Math.max(0, Math.min(1440, Math.round(Number($('f-minutes').value) || 0))), notes: $('f-notes').value.trim(),
      tags: formTags.slice(), subtasks: formSubs.map((s) => s.text),
    };
    const i = templates().findIndex((x) => sameName(x.name, t.name));
    if (i >= 0) { t.id = templates()[i].id; templates()[i] = t; } else templates().push(t);
    persist();
    renderTemplateChips();
    showToast(`Modèle « ${t.name} » enregistré`);
  }

  function renderTemplateManager() {
    const box = $('o-templates');
    box.textContent = '';
    if (!templates().length) { box.append(el('div', 'empty-rows', 'Aucun modèle.')); return; }
    templates().forEach((t) => {
      const row = el('div', 'srow');
      const input = el('input');
      input.type = 'text';
      input.value = t.name;
      input.maxLength = 60;
      input.className = 'tpl-name';
      input.setAttribute('aria-label', 'Nom du modèle');
      input.addEventListener('change', () => {
        const v = input.value.trim().slice(0, 60);
        if (v) { t.name = v; persist(); renderTemplateChips(); } else input.value = t.name;
      });
      const n = (t.subtasks || []).length;
      const info = el('span', 'scount', n ? plural(n, 'étape', 'étapes') : '');
      const del = button('del');
      del.append(mkIcon('trash'));
      del.title = 'Supprimer ce modèle';
      del.setAttribute('aria-label', 'Supprimer ce modèle');
      del.addEventListener('click', () => {
        state.settings.templates = templates().filter((x) => x !== t);
        persist();
        renderTemplateManager();
        renderTemplateChips();
      });
      row.append(input, info, del);
      box.append(row);
    });
  }

  $('f-tpl-save').addEventListener('click', saveAsTemplate);
  $('o-tpl-restore').addEventListener('click', () => {
    const have = new Set(templates().map((t) => t.id));
    const missing = cloneTemplates().filter((t) => !have.has(t.id));
    if (!missing.length) { showToast('Tous les modèles par défaut sont déjà là.'); return; }
    state.settings.templates = templates().concat(missing);
    persist();
    renderTemplateManager();
    renderTemplateChips();
  });

  // ---------- Ajout rapide ----------
  const qi = $('quickInput');
  const quickParse = () => QuickAdd.parseQuick(qi.value, { today: todayStr(), subjects: state.settings.subjects });

  function renderQuickPreview() {
    const box = $('quickPreview');
    box.textContent = '';
    const text = qi.value.trim();
    box.hidden = !text;
    if (!text) return;
    const r = quickParse();
    if (!r.title) { box.append(el('span', 'qp-hint', 'Ajoute au moins un titre.')); return; }
    const title = el('span', 'qp-title', r.title);
    box.append(title);
    const chip = (label, color) => {
      const c = el('span', 'qp-chip', label);
      if (color) { c.style.setProperty('--c', color); c.classList.add('colored'); }
      box.append(c);
      return c;
    };
    if (r.subject) chip(r.subject, subjectColor(r.subject));
    if (r.date) chip(formatDate(r.date));
    if (r.found.priority) chip(PRIORITY_LABELS[r.priority]);
    if (r.kind) chip(`${KINDS[r.kind].emoji} ${KINDS[r.kind].label}`);
    if (r.minutes) chip(fmtMinutes(r.minutes));
    r.tags.forEach((t) => chip('#' + t));
    box.append(el('span', 'qp-hint', 'Entrée pour ajouter'));
  }

  function addQuick() {
    if (!qi.value.trim()) return;
    const r = quickParse();
    if (!r.title) { showToast('Ajoute au moins un titre.'); return; }
    const priority = r.found.priority ? r.priority : (Number(state.settings.defaultPriority) || 1);
    state.homework.push({
      id: uid(), done: false, created: Date.now(), title: r.title.slice(0, 120), subject: r.subject, date: r.date, priority, notes: '',
      kind: r.kind, minutes: r.minutes, repeat: '', tags: r.tags.slice(0, 10), subtasks: [], attachments: [], grade: null, gradeMax: null, coef: null,
    });
    persist();
    qi.value = '';
    renderQuickPreview();
    render();
    showToast(r.date ? `Ajouté : « ${r.title} » pour le ${formatDate(r.date)}` : `Ajouté : « ${r.title} »`);
  }

  qi.addEventListener('input', renderQuickPreview);
  qi.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); addQuick(); }
    else if (e.key === 'Escape') { e.preventDefault(); if (qi.value) { qi.value = ''; renderQuickPreview(); } else qi.blur(); }
  });

  // ---------- Corbeille et archive ----------
  let boxKind = 'trash';
  const boxDlg = $('boxDialog');
  const trashItems = () => state.trash.filter((h) => !h.purged);

  function counts() {
    if (!$('c-trash')) return;
    const t = trashItems().length;
    const a = state.archive.length;
    $('c-trash').textContent = t;
    $('c-archive').textContent = a;
    $('c-trash').hidden = t === 0;
    $('c-archive').hidden = a === 0;
  }

  function purgeTrash() {
    const limit = Date.now() - TRASH_DAYS * DAY;
    const before = state.trash.length;
    state.trash = state.trash.filter((h) => (h.deletedAt || Date.now()) >= limit);
    return before - state.trash.length;
  }

  // Devoirs terminés depuis plus de « months » mois : ils quittent la liste (sans être supprimés)
  function archiveOld(months) {
    if (!months) return 0;
    const limit = new Date();
    limit.setMonth(limit.getMonth() - months);
    const lim = limit.getTime();
    const now = Date.now();
    let n = 0;
    state.homework = state.homework.filter((h) => {
      if (!h.done) return true;
      const ref = Math.max(h.doneAt || 0, h.restoredAt || 0) || (h.date ? parseDate(h.date).getTime() : (h.created || now));
      if (ref >= lim) return true;
      h.archivedAt = now;
      state.archive.push(h);
      n++;
      return false;
    });
    return n;
  }

  function maintenance() {
    const a = archiveOld(Number(state.settings.archiveMonths) || 0);
    const p = purgeTrash();
    if (a || p) { persist(); render(); }
  }

  function restoreItem(h) {
    if (boxKind === 'trash') { state.trash = state.trash.filter((x) => x !== h); delete h.deletedAt; } else { state.archive = state.archive.filter((x) => x !== h); delete h.archivedAt; h.restoredAt = Date.now(); }
    state.homework.push(h);
    persist();
    render();
    renderBox();
    showToast(`« ${h.title} » restauré`);
  }

  function removeFromBox(h) {
    if (boxKind === 'trash') {
      if (!confirm(`Supprimer définitivement « ${h.title} » ?\n\nCette action est irréversible.`)) return;
      const i = state.trash.indexOf(h);
      if (i < 0) return;
      // Avec la synchronisation, on garde une trace pour que l'autre ordinateur le supprime aussi
      if (state.settings.syncFolder) state.trash[i] = { id: h.id, title: '—', subject: '', date: '', notes: '', priority: 1, done: false, created: h.created || Date.now(), purged: true, deletedAt: Date.now() };
      else state.trash.splice(i, 1);
    } else {
      state.archive = state.archive.filter((x) => x !== h);
      delete h.archivedAt;
      h.deletedAt = Date.now();
      state.trash.push(h);
    }
    persist();
    renderBox();
    counts();
  }

  function renderBox() {
    const trash = boxKind === 'trash';
    $('boxTitle').textContent = trash ? 'Corbeille' : 'Archive';
    $('boxHint').textContent = trash
      ? `Les devoirs supprimés sont gardés ${TRASH_DAYS} jours, puis disparaissent.`
      : 'Les devoirs terminés depuis longtemps. Ils comptent toujours dans les statistiques.';
    $('boxEmpty').hidden = !trash;
    const q = normTxt($('boxSearch').value.trim());
    const pool = (trash ? trashItems() : state.archive).slice().sort((a, b) => (trash ? (b.deletedAt || 0) - (a.deletedAt || 0) : (b.archivedAt || 0) - (a.archivedAt || 0)));
    const items = q ? pool.filter((h) => normTxt(searchText(h)).includes(q)) : pool;
    const ul = $('boxList');
    ul.textContent = '';
    if (!items.length) {
      ul.append(el('li', 'box-empty', q ? 'Aucun résultat.' : (trash ? 'La corbeille est vide.' : "L'archive est vide.")));
      return;
    }
    const fmtDay = (t) => new Date(t).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
    items.forEach((h) => {
      const li = el('li', 'box-item');
      li.style.setProperty('--c', subjectColor(h.subject));
      const body = el('div', 'box-body');
      body.append(el('div', 'box-title', h.title));
      const meta = [];
      if (h.subject) meta.push(h.subject);
      if (h.date) meta.push(formatDate(h.date));
      const when = el('div', 'box-meta');
      when.textContent = meta.join(' · ');
      const stamp = el('span', 'box-when', trash ? `Supprimé le ${fmtDay(h.deletedAt || Date.now())}` : `Archivé le ${fmtDay(h.archivedAt || Date.now())}`);
      if (trash) {
        const left = Math.max(0, Math.ceil(((h.deletedAt || Date.now()) + TRASH_DAYS * DAY - Date.now()) / DAY));
        stamp.textContent += ` · ${plural(left, 'jour restant', 'jours restants')}`;
      }
      when.append(meta.length ? ' · ' : '', stamp);
      body.append(when);
      const btns = el('div', 'btns');
      const rs = button('ghost small', 'Restaurer');
      rs.addEventListener('click', () => restoreItem(h));
      const del = button('del');
      del.append(mkIcon('trash'));
      del.title = trash ? 'Supprimer définitivement' : 'Mettre à la corbeille';
      del.setAttribute('aria-label', del.title);
      del.addEventListener('click', () => removeFromBox(h));
      btns.append(rs, del);
      li.append(body, btns);
      ul.append(li);
    });
  }

  function openBox(kind) {
    boxKind = kind;
    $('boxSearch').value = '';
    document.querySelectorAll('dialog[open]').forEach((d) => { if (d !== boxDlg && d.id !== 'lockDialog') d.close(); });
    renderBox();
    if (!boxDlg.open) boxDlg.showModal();
  }

  $('trashBtn').addEventListener('click', () => openBox('trash'));
  $('archiveBtn').addEventListener('click', () => openBox('archive'));
  $('boxClose').addEventListener('click', () => boxDlg.close());
  $('boxOk').addEventListener('click', () => boxDlg.close());
  $('boxSearch').addEventListener('input', renderBox);
  $('boxEmpty').addEventListener('click', () => {
    const items = trashItems();
    if (!items.length) return;
    if (!confirm(`Vider la corbeille (${plural(items.length, 'devoir', 'devoirs')}) ?\n\nCette action est irréversible.`)) return;
    const ids = new Set(items.map((h) => h.id));
    state.trash = state.settings.syncFolder
      ? state.trash.map((h) => (ids.has(h.id) ? { id: h.id, title: '—', subject: '', date: '', notes: '', priority: 1, done: false, created: h.created || Date.now(), purged: true, deletedAt: Date.now() } : h))
      : state.trash.filter((h) => !ids.has(h.id));
    persist();
    renderBox();
    counts();
  });

  // Réglages d'archivage
  function renderArchiveSettings() {
    $('o-archive').value = String(state.settings.archiveMonths ?? 6);
    const n = state.archive.length;
    $('o-archive-msg').textContent = n ? `${plural(n, 'devoir archivé', 'devoirs archivés')}.` : 'Aucun devoir archivé pour le moment.';
  }
  $('o-archive').addEventListener('change', (e) => { state.settings.archiveMonths = Number(e.target.value); persist(); });
  $('o-archive-now').addEventListener('click', () => {
    const months = Number($('o-archive').value) || 0;
    if (!months) { showToast("Choisis d'abord un délai (3 mois, 6 mois…)."); return; }
    const n = archiveOld(months);
    if (n) { persist(); render(); }
    renderArchiveSettings();
    showToast(n ? `${plural(n, 'devoir archivé', 'devoirs archivés')}` : 'Rien à archiver.');
  });
  $('o-archive-open').addEventListener('click', () => openBox('archive'));
  $('o-trash-open').addEventListener('click', () => openBox('trash'));

  // ---------- Import d'un emploi du temps ----------
  $('sched-import').addEventListener('click', async () => {
    const msg = $('sched-msg');
    let r;
    try { r = await api.importSchedule(); } catch (e) { r = { ok: false, reason: 'read' }; }
    if (!r || r.canceled) return;
    if (!r.ok) {
      msg.textContent = {
        size: 'Ce fichier est trop gros.',
        empty: "Aucune matière trouvée dans ce fichier. Vérifie le format (exemple : « Maths;lundi, mercredi » sur chaque ligne).",
        read: 'Impossible de lire ce fichier.',
      }[r.reason] || 'Impossible de lire ce fichier.';
      return;
    }
    const before = JSON.parse(JSON.stringify(state.settings.subjects));
    let created = 0;
    let updated = 0;
    r.rows.forEach((row) => {
      const s = findSubject(row.name);
      if (s) { s.days = row.days.slice().sort(); updated++; } else { state.settings.subjects.push({ id: uid(), name: row.name, color: nextFreeColor(), days: row.days.slice().sort() }); created++; }
    });
    persist();
    renderSubjectManager();
    render();
    msg.textContent = `Importé depuis « ${r.name} » : ${plural(updated, 'matière mise à jour', 'matières mises à jour')}, ${plural(created, 'créée', 'créées')}.`;
    pushUndo("Emploi du temps importé", () => { state.settings.subjects = before; renderSubjectManager(); });
  });

  // ---------- Mini-widget ----------
  async function refreshWidgetUi() {
    let open = false;
    try { open = await api.widgetState(); } catch (e) { /* indisponible */ }
    $('w-open').checked = open;
    $('w-auto').checked = !!state.settings.widgetAuto;
  }
  $('w-open').addEventListener('change', async (e) => {
    let on = false;
    try { on = await api.toggleWidget(e.target.checked); } catch (err) { /* indisponible */ }
    $('w-open').checked = on;
  });
  $('w-auto').addEventListener('change', (e) => { state.settings.widgetAuto = e.target.checked; persist(); });
  $('widgetBtn').addEventListener('click', async () => {
    let on = false;
    try { on = await api.toggleWidget(); } catch (e) { return; }
    showToast(on ? 'Mini-widget affiché' : 'Mini-widget fermé');
  });

  // ---------- Synchronisation ----------
  const SYNC_ERRORS = {
    access: 'dossier inaccessible',
    format: "fichier de synchro non reconnu, rien n'a été modifié",
    json: "fichier de synchro non reconnu, rien n'a été modifié",
    'too-new': "fichier créé par une version plus récente : mets l'application à jour",
  };

  async function renderSyncUi() {
    const folder = state.settings.syncFolder;
    $('sync-pick').textContent = folder ? 'Changer de dossier…' : 'Choisir un dossier…';
    $('sync-now').hidden = $('sync-off').hidden = !folder;
    if (!folder) { $('sync-status').textContent = 'Désactivée.'; return; }
    let st = {};
    try { st = await api.syncStatus(); } catch (e) { /* pas grave */ }
    const when = st.lastSync ? new Date(st.lastSync).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }) : '';
    $('sync-status').textContent = st.error ? `${folder} — ${SYNC_ERRORS[st.error] || st.error}` : when ? `${folder} — dernière synchro à ${when}` : folder;
  }

  async function syncNow(quiet) {
    let r;
    try { r = await api.syncNow(); } catch (e) { r = { ok: false, error: 'access' }; }
    if (r.data) applyExternalData(r.data);
    await renderSyncUi();
    if (!quiet) showToast(r.ok ? 'Synchronisé' : `Synchro impossible : ${SYNC_ERRORS[r.error] || 'erreur'}`);
  }

  $('sync-pick').addEventListener('click', async () => {
    let r;
    try { r = await api.syncPick(); } catch (e) { return; }
    if (!r || !r.ok) return;
    state.settings.syncFolder = r.folder;
    clearTimeout(saveTimer);
    saveNow();
    await syncNow(false);
  });
  $('sync-now').addEventListener('click', () => { clearTimeout(saveTimer); saveNow(); syncNow(false); });
  $('sync-off').addEventListener('click', () => {
    state.settings.syncFolder = '';
    persist();
    renderSyncUi();
    showToast('Synchronisation arrêtée');
  });

  // ---------- Code de verrouillage ----------
  const lockDlg = $('lockDialog');
  const LOCK_ITER = 150000;
  let lockedNow = false;
  let fails = 0;
  let lockoutUntil = 0;
  let lastActivity = Date.now();
  let lockMode = null; // 'set' | 'change' | 'remove'

  const hasLock = () => !!(state.settings.lock && state.settings.lock.hash);
  const b64 = (u8) => btoa(String.fromCharCode(...u8));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function hashCode(code, saltB64, iter) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltB64), iterations: iter, hash: 'SHA-256' }, key, 256);
    return b64(new Uint8Array(bits));
  }
  async function checkCode(code) {
    const l = state.settings.lock;
    if (!l || !l.hash) return true;
    try { return (await hashCode(code, l.salt, l.iter || LOCK_ITER)) === l.hash; } catch (e) { return false; }
  }

  function lockNow() {
    if (!hasLock()) return false;
    document.querySelectorAll('dialog[open]').forEach((d) => { if (d !== lockDlg) d.close(); });
    lockedNow = true;
    $('lockInput').value = '';
    $('lockErr').textContent = '';
    $('lockForgotText').hidden = true;
    if (!lockDlg.open) lockDlg.showModal();
    $('lockInput').focus();
    return true;
  }
  lockDlg.addEventListener('cancel', (e) => e.preventDefault());
  lockDlg.addEventListener('close', () => { if (lockedNow) lockNow(); }); // Échap deux fois : on la rouvre

  $('lockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const wait = Math.ceil((lockoutUntil - Date.now()) / 1000);
    if (wait > 0) { $('lockErr').textContent = `Trop d'essais. Réessaie dans ${plural(wait, 'seconde', 'secondes')}.`; return; }
    if (await checkCode($('lockInput').value)) {
      lockedNow = false;
      fails = 0;
      lastActivity = Date.now();
      lockDlg.close();
    } else {
      fails++;
      $('lockInput').value = '';
      $('lockInput').focus();
      if (fails >= 5) { lockoutUntil = Date.now() + 10000 * (fails - 4); $('lockErr').textContent = `Trop d'essais. Réessaie dans ${plural(10 * (fails - 4), 'seconde', 'secondes')}.`; } else $('lockErr').textContent = 'Code incorrect.';
    }
  });
  $('lockForgot').addEventListener('click', () => { $('lockForgotText').hidden = !$('lockForgotText').hidden; });

  ['mousemove', 'keydown', 'mousedown', 'wheel', 'touchstart'].forEach((ev) => document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true, capture: true }));
  setInterval(() => {
    const m = Number(state.settings.lockAfter) || 0;
    if (m && hasLock() && !lockedNow && Date.now() - lastActivity > m * 60000) lockNow();
  }, 10000);

  function renderLockUi() {
    const has = hasLock();
    $('lock-state').textContent = has ? 'Un code est défini : il est demandé à chaque ouverture.' : "Aucun code. L'application s'ouvre sans rien demander.";
    $('lock-set').textContent = has ? 'Changer le code' : 'Définir un code';
    $('lock-remove').hidden = !has;
    $('lock-form').hidden = !lockMode;
    $('lk-current').hidden = !(has && lockMode);
    $('lk-new').hidden = $('lk-confirm').hidden = lockMode === 'remove';
    $('lk-after').disabled = !has;
    $('lk-after').value = String(state.settings.lockAfter || 0);
  }
  function openLockForm(mode) {
    lockMode = mode;
    ['lk-current', 'lk-new', 'lk-confirm'].forEach((id) => { $(id).value = ''; });
    $('lk-err').textContent = '';
    renderLockUi();
    const first = hasLock() ? $('lk-current') : $('lk-new');
    if (mode === 'remove') $('lk-current').focus(); else first.focus();
  }
  $('lock-set').addEventListener('click', () => openLockForm(hasLock() ? 'change' : 'set'));
  $('lock-remove').addEventListener('click', () => openLockForm('remove'));
  $('lk-cancel').addEventListener('click', () => { lockMode = null; $('lk-err').textContent = ''; renderLockUi(); });
  $('lk-after').addEventListener('change', (e) => { state.settings.lockAfter = Number(e.target.value); persist(); });
  $('lk-save').addEventListener('click', async () => {
    const err = (m) => { $('lk-err').textContent = m; };
    if (hasLock() && !(await checkCode($('lk-current').value))) { err('Le code actuel est incorrect.'); return; }
    if (lockMode === 'remove') {
      delete state.settings.lock;
      state.settings.lockAfter = 0;
      persist();
      lockMode = null;
      renderLockUi();
      showToast('Code retiré');
      return;
    }
    const code = $('lk-new').value;
    if (code.length < 4) { err('Le code doit faire au moins 4 caractères.'); return; }
    if (code !== $('lk-confirm').value) { err('Les deux codes ne sont pas identiques.'); return; }
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    state.settings.lock = { salt, iter: LOCK_ITER, hash: await hashCode(code, salt, LOCK_ITER) };
    persist();
    lockMode = null;
    $('lk-err').textContent = '';
    renderLockUi();
    showToast('Code enregistré');
  });

  // ---------- Langue ----------
  function renderLangUi() {
    const cur = isEnglish() ? 'en' : 'fr';
    document.querySelectorAll('#langSeg button').forEach((b) => {
      const on = b.dataset.lang === cur;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    });
  }
  $('langSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lang]');
    if (!b || b.dataset.lang === (isEnglish() ? 'en' : 'fr')) return;
    state.settings.language = b.dataset.lang;
    clearTimeout(saveTimer);
    saveNow();
    setTimeout(() => location.reload(), 200); // l'interface est reconstruite dans la nouvelle langue
  });

  // ---------- Branchement avec le reste de l'appli ----------
  function init() {
    const s = state.settings;
    let changed = false;
    if (!Array.isArray(s.templates)) { s.templates = cloneTemplates(); changed = true; }
    const lang = s.language === 'en' ? 'en' : 'fr';
    LOCALE = lang === 'en' ? 'en-GB' : 'fr-FR';
    document.documentElement.lang = lang;
    if (window.I18N) window.I18N.start(lang);
    const a = archiveOld(Number(s.archiveMonths) || 0);
    const p = purgeTrash();
    if (changed || a || p) persist();
    renderTemplateChips();
    counts();
    if (hasLock()) lockNow();
    setInterval(maintenance, 60 * 60 * 1000);
    api.onNewRequest(() => { if (!lockedNow) openDialog(null); });
  }

  window.extras = {
    init,
    counts,
    lockNow,
    dataReplaced() { counts(); renderTemplateChips(); },
    dialogOpened(isEdit) { $('f-tpl-box').hidden = isEdit; renderTemplateChips(); },
    tabShown(tab) {
      if (tab === 'organize') { renderTemplateManager(); renderArchiveSettings(); }
      if (tab === 'comfort') { renderLangUi(); renderLockUi(); refreshWidgetUi(); renderSyncUi(); }
    },
    commands() {
      const list = [
        ['Ajout rapide (une phrase)', () => $('quickInput').focus(), 'ajouter phrase rapide'],
        ['Ouvrir la corbeille', () => openBox('trash'), 'supprimes'],
        ["Ouvrir l'archive", () => openBox('archive'), 'anciens termines'],
        ['Afficher / masquer le mini-widget', () => $('widgetBtn').click(), 'widget bureau'],
      ];
      if (hasLock()) list.push(['Verrouiller maintenant', () => lockNow(), 'code mot de passe']);
      if (state.settings.syncFolder) list.push(['Synchroniser maintenant', () => syncNow(false), 'synchro']);
      return list;
    },
  };
}());
