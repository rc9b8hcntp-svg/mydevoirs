// Bouton flottant « + Mes Devoirs » sur Pronote / École Directe.
// Astuce : sélectionne le texte du devoir sur la page avant de cliquer (ou Alt+Maj+D) : matière, date, priorité et durée sont reconnues.
(() => {
  if (window.top !== window || document.getElementById('mesdevoirs-ext')) return;
  const MD = self.MesDevoirs;

  const host = document.createElement('div');
  host.id = 'mesdevoirs-ext';
  host.style.cssText = 'all:initial;position:fixed;right:18px;bottom:18px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
  <style>
    :host,*{box-sizing:border-box;font-family:system-ui,"Segoe UI",sans-serif}
    .w{--bg:#fff;--fg:#14141a;--mut:#6b6b78;--line:#dcdce3;--field:#f6f6f9;--acc:#4f46e5;--acc2:#4338ca}
    @media (prefers-color-scheme:dark){.w{--bg:#1b1b22;--fg:#f2f2f6;--mut:#9a9aa8;--line:#34343f;--field:#121217;--acc:#7b8cff;--acc2:#97a4ff}}
    .fab{width:48px;height:48px;border-radius:50%;border:0;background:var(--acc);color:#fff;font-size:26px;line-height:1;cursor:pointer;box-shadow:0 4px 14px #0005;transition:transform .15s}
    .fab:hover{background:var(--acc2);transform:scale(1.06)}
    .fab:focus-visible,button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
    .panel{display:none;position:absolute;right:0;bottom:58px;width:318px;max-height:calc(100vh - 96px);overflow:auto;background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:14px;padding:12px 14px 14px;box-shadow:0 10px 32px #0006}
    .panel.open{display:block;animation:pop .15s ease-out}
    @keyframes pop{from{opacity:0;transform:translateY(6px)}}
    .head{display:flex;align-items:center;gap:8px;margin-bottom:4px}
    h4{margin:0;font-size:14px;flex:1}
    .dot{width:9px;height:9px;border-radius:50%;background:#9a9aa8}
    .dot.on{background:#22a06b}.dot.off{background:#f59e0b}
    .x{border:0;background:none;color:var(--mut);cursor:pointer;font-size:14px;border-radius:6px;width:24px;height:24px}
    .x:hover{background:var(--field);color:var(--fg)}
    label{display:block;font-size:11px;font-weight:600;color:var(--mut);margin:9px 0 3px}
    input,textarea,select{width:100%;border:1px solid var(--line);border-radius:8px;padding:7px 8px;font-size:13px;color:var(--fg);background:var(--field);font-family:inherit}
    input:focus,textarea:focus,select:focus{outline:2px solid color-mix(in srgb,var(--acc) 45%,transparent);border-color:var(--acc)}
    textarea{height:54px;resize:vertical}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .chips{display:flex;gap:5px;margin-top:5px;flex-wrap:wrap}
    .chips button,.seg button{border:1px solid var(--line);background:var(--field);color:var(--fg);border-radius:99px;padding:2px 9px;font-size:11.5px;cursor:pointer}
    .chips button:hover,.seg button:hover{border-color:var(--acc)}
    .seg{display:flex;gap:5px}
    .seg button{flex:1;border-radius:8px;padding:6px 4px}
    .seg button.on{background:var(--acc);border-color:var(--acc);color:#fff;font-weight:600}
    .seg button.on[data-p="3"]{background:#e5484d;border-color:#e5484d}
    .row{display:flex;gap:6px;margin-top:12px}
    button.ok{flex:1;background:var(--acc);color:#fff;border:0;border-radius:8px;padding:9px;cursor:pointer;font-size:13px;font-weight:600}
    button.ok:hover{background:var(--acc2)}button.ok:disabled{opacity:.6;cursor:wait}
    button.no{background:var(--field);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:9px 12px;cursor:pointer;font-size:13px}
    .msg{display:none;margin-top:8px;padding:8px;border-radius:8px;font-size:12px;line-height:1.4;background:#fef3c7;color:#78350f}
    .msg.ok{background:#dcfce7;color:#14532d}
    .msg a{display:inline-block;margin-top:6px;background:var(--acc);color:#fff;padding:6px 10px;border-radius:6px;text-decoration:none;font-weight:600}
    .hint{font-size:11px;color:var(--mut);margin-top:8px}
    kbd{font:inherit;font-size:10.5px;border:1px solid var(--line);border-radius:4px;padding:0 4px;background:var(--field)}
    .found{font-size:11px;color:var(--acc);margin:2px 0 0;min-height:14px}
    .fab{position:relative}
    .badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;border-radius:10px;background:#e5484d;color:#fff;font-size:11px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 5px;border:2px solid var(--bg)}
    .badge.on{display:flex}
    .det{border:1px solid var(--acc);background:color-mix(in srgb,var(--acc) 8%,transparent);border-radius:10px;padding:8px 9px;margin:6px 0 4px}
    .det-h{font-size:12px;margin-bottom:6px}
    .di{display:flex;gap:7px;align-items:flex-start;padding:4px 0;border-top:1px solid var(--line);font-size:12px}
    .di:first-of-type{border-top:0}
    .di input{width:auto;margin-top:2px}
    .di .tx{flex:1;min-width:0}.di .tt{font-weight:600;word-break:break-word}.di .mt{color:var(--mut);font-size:11px}
    .di button{border:0;background:none;color:var(--mut);cursor:pointer;font-size:13px;border-radius:6px}
    .di button:hover{background:var(--field);color:var(--fg)}
    .det .row{margin-top:6px}.det .row button{padding:6px 10px;font-size:12px}
    .toast{position:absolute;right:0;bottom:58px;max-width:260px;background:var(--fg);color:var(--bg);font-size:12px;padding:8px 11px;border-radius:10px;box-shadow:0 6px 20px #0005;display:none}
    .toast.on{display:block;animation:pop .15s ease-out}
  </style>
  <div class="w">
  <div class="toast" id="toast" role="status"></div>
  <button class="fab" title="Ajouter à Mes Devoirs (Alt+Maj+D)" aria-label="Ajouter à Mes Devoirs">+<span class="badge" id="badge"></span></button>
  <div class="panel" role="dialog" aria-label="Ajouter à Mes Devoirs">
    <div class="head"><h4>📚 Ajouter à Mes Devoirs</h4><span class="dot" id="st"></span><button class="x" aria-label="Fermer">✕</button></div>
    <div class="det" id="det" hidden>
      <div class="det-h">🔎 <b id="detN"></b></div>
      <div id="detList"></div>
      <div class="row"><button class="ok" id="detAdd">Ajouter la sélection</button><button class="no" id="detIgnore">Ignorer</button></div>
      <div class="msg" id="detMsg"></div>
    </div>
    <div class="found" id="found"></div>
    <label for="t">Titre</label><input id="t" maxlength="120">
    <div class="two">
      <div><label for="s">Matière</label><select id="s"></select></div>
      <div><label for="d">Pour le</label><input id="d" type="date"></div>
    </div>
    <div class="chips" id="dq"><button type="button" data-d="0">Aujourd'hui</button><button type="button" data-d="1">Demain</button><button type="button" data-d="7">Dans 1 semaine</button></div>
    <label>Priorité</label>
    <div class="seg" id="p"><button type="button" data-p="1">Normale</button><button type="button" data-p="2">Importante</button><button type="button" data-p="3">Urgente</button></div>
    <div class="two">
      <div><label for="k">Type</label><select id="k"><option value="">Devoir</option><option value="controle">📝 Contrôle</option><option value="expose">🎤 Exposé</option></select></div>
      <div><label for="m">Durée (min)</label><input id="m" type="number" min="0" max="1440" step="5" placeholder="—"></div>
    </div>
    <label for="n">Notes</label><textarea id="n"></textarea>
    <div class="row"><button class="ok" id="go">Ajouter</button><button class="no" id="cancel">Annuler</button></div>
    <div class="msg" id="m2"></div>
    <div class="hint">Sélectionne le texte du devoir avant d'ouvrir : tout est pré-rempli. <kbd>Ctrl</kbd>+<kbd>Entrée</kbd> pour ajouter, <kbd>Alt</kbd>+<kbd>Maj</kbd>+<kbd>D</kbd> pour ouvrir.</div>
  </div></div>`;
  document.documentElement.appendChild(host);

  const $ = (s) => root.querySelector(s);
  const panel = $('.panel');
  let lastSel = '';
  let priority = 0;
  let subjects = MD.DEFAULT_SUBJECTS;
  document.addEventListener('selectionchange', () => {
    const t = String(window.getSelection() || '').trim();
    if (t) lastSel = t;
  });

  const send = async (msg) => { try { return await chrome.runtime.sendMessage(msg); } catch (e) { return null; } };
  const msg = (text, kind) => { const m = $('#m2'); m.className = 'msg' + (kind ? ' ' + kind : ''); m.textContent = text; m.style.display = 'block'; return m; };

  function setPriority(p) {
    priority = p;
    root.querySelectorAll('#p button').forEach((b) => b.classList.toggle('on', Number(b.dataset.p) === p));
  }
  function fillSubjects(selected) {
    const sel = $('#s');
    const names = subjects.map((s) => s.name);
    if (selected && !names.includes(selected)) names.push(selected);
    sel.textContent = '';
    const none = document.createElement('option'); none.value = ''; none.textContent = '— Aucune —'; sel.appendChild(none);
    names.forEach((n) => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
    sel.value = selected || '';
  }
  root.querySelectorAll('#p button').forEach((b) => b.addEventListener('click', () => setPriority(priority === Number(b.dataset.p) ? 0 : Number(b.dataset.p))));
  root.querySelectorAll('#dq button').forEach((b) => b.addEventListener('click', () => { $('#d').value = MD.addDays(Number(b.dataset.d)); }));

  async function open() {
    const f = MD.parseSelection(lastSel, subjects);
    lastSel = '';
    editingKey = '';
    $('#t').value = f.title;
    $('#n').value = f.notes;
    $('#d').value = f.date;
    $('#m').value = f.minutes || '';
    $('#k').value = f.kind;
    setPriority(f.priority);
    fillSubjects(f.subject);
    const hits = [f.subject, f.date && MD.dateLabel(f.date), f.priority && ['', 'normale', 'importante', 'urgente'][f.priority], f.minutes && f.minutes + ' min', f.kind].filter(Boolean);
    $('#found').textContent = hits.length ? '✨ Reconnu : ' + hits.join(' · ') : '';
    $('#m2').style.display = 'none';
    panel.classList.add('open');
    $('#t').focus();
    // état de l'appli et liste de ses matières (la matière reconnue est conservée)
    const st = await send({ type: 'info' });
    const dot = $('#st');
    dot.className = 'dot ' + (st && st.ok ? 'on' : 'off');
    dot.title = st && st.ok ? 'Mes Devoirs est lancé' : "Mes Devoirs n'est pas lancé : il s'ouvrira à l'ajout";
    if (st && st.subjects && st.subjects.length) { subjects = st.subjects; const keep = $('#s').value; fillSubjects(keep); }
  }
  const close = () => panel.classList.remove('open');
  const toggle = () => (panel.classList.contains('open') ? close() : open());

  $('.fab').addEventListener('click', toggle);
  $('#cancel').addEventListener('click', close);
  $('.x').addEventListener('click', close);
  chrome.runtime.onMessage.addListener((m) => { if (m && m.type === 'toggle') toggle(); });
  document.addEventListener('mousedown', (e) => { if (panel.classList.contains('open') && !e.composedPath().includes(host)) close(); }, true);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.target.id === 't')) { e.preventDefault(); $('#go').click(); }
    e.stopPropagation();
  });
  panel.addEventListener('keyup', (e) => e.stopPropagation());
  panel.addEventListener('keypress', (e) => e.stopPropagation());

  // Ajoute un devoir : direct si l'appli tourne, sinon on la lance puis on attend. Renvoie « ok » ou « absent ».
  async function submit(fields) {
    let r = await send({ type: 'add', fields });
    if (r && r.ok) return 'ok';
    const q = new URLSearchParams({ title: fields.title, subject: fields.subject || '', date: fields.date || '', notes: fields.notes || '' });
    if (fields.priority) q.set('priority', String(fields.priority));
    if (fields.minutes) q.set('minutes', String(fields.minutes));
    if (fields.kind) q.set('kind', fields.kind);
    if (fields.tags && fields.tags.length) q.set('tags', fields.tags.join(','));
    const a = document.createElement('a');
    a.href = 'mesdevoirs://add?' + q.toString();
    root.appendChild(a); a.click(); a.remove();
    r = await send({ type: 'wait' });
    return r && r.ok ? 'ok' : 'absent';
  }
  const notInstalled = (m) => {
    m.textContent = "Mes Devoirs n'a pas répondu : l'appli n'est probablement pas installée sur cet ordinateur. L'extension a besoin de l'appli (gratuite) pour enregistrer tes devoirs. Installe-la, puis recommence.";
    m.style.display = 'block';
    const dl = document.createElement('a');
    dl.href = MD.SITE; dl.target = '_blank'; dl.rel = 'noopener'; dl.textContent = 'Télécharger Mes Devoirs';
    m.appendChild(document.createElement('br')); m.appendChild(dl);
  };

  $('#go').addEventListener('click', async () => {
    const title = $('#t').value.trim();
    if (!title) { $('#t').focus(); return; }
    const fields = {
      title, subject: $('#s').value, date: $('#d').value, notes: $('#n').value.trim(),
      priority, minutes: Math.max(0, Math.min(1440, Math.round(Number($('#m').value) || 0))), kind: $('#k').value,
    };
    const btn = $('#go'); btn.disabled = true;
    msg('Ajout en cours…');
    const res = await submit(fields);
    btn.disabled = false;
    if (res === 'ok') {
      msg('✓ Ajouté à Mes Devoirs', 'ok');
      if (editingKey) { detected = detected.filter((d) => d.key !== editingKey); MD.detect.store.mark([editingKey]); editingKey = ''; renderDetected(); }
      setTimeout(close, 1400);
    } else notInstalled(msg(''));
  });

  // ---------- Détection automatique des devoirs de la page ----------
  let detected = [];
  let editingKey = '';
  let opts = { mdDetect: true, mdAuto: false, mdSeen: {} };
  let toastTimer = null;
  const toast = (t) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => e.classList.remove('on'), 5000); };

  function renderDetected() {
    const n = detected.length;
    const badge = $('#badge');
    badge.textContent = String(n); badge.classList.toggle('on', n > 0);
    $('#det').hidden = n === 0;
    $('#detN').textContent = n === 1 ? '1 devoir détecté sur cette page' : n + ' devoirs détectés sur cette page';
    const list = $('#detList');
    list.textContent = '';
    detected.forEach((d) => {
      const row = document.createElement('div'); row.className = 'di';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true; cb.dataset.key = d.key;
      cb.setAttribute('aria-label', 'Ajouter ' + d.title);
      const tx = document.createElement('div'); tx.className = 'tx';
      const tt = document.createElement('div'); tt.className = 'tt'; tt.textContent = d.title;
      const mt = document.createElement('div'); mt.className = 'mt';
      mt.textContent = [d.subject, MD.dateLabel(d.date), d.minutes && d.minutes + ' min', d.priority === 3 && 'urgent'].filter(Boolean).join(' · ');
      tx.append(tt, mt);
      const ed = document.createElement('button'); ed.type = 'button'; ed.title = 'Modifier avant d\'ajouter'; ed.setAttribute('aria-label', 'Modifier'); ed.textContent = '✎';
      ed.addEventListener('click', () => {
        editingKey = d.key;
        $('#t').value = d.title; $('#n').value = d.notes || ''; $('#d').value = d.date; $('#m').value = d.minutes || ''; $('#k').value = d.kind || '';
        setPriority(d.priority || 0); fillSubjects(d.subject); $('#t').focus();
      });
      row.append(cb, tx, ed);
      list.appendChild(row);
    });
  }

  async function addDetected(items) {
    const msgEl = $('#detMsg');
    msgEl.style.display = 'none';
    let added = 0;
    for (const d of items) {
      const res = await submit({ title: d.title, subject: d.subject, date: d.date, notes: d.notes || '', priority: d.priority, minutes: d.minutes, kind: d.kind, tags: d.tags });
      if (res !== 'ok') { notInstalled(msgEl); break; }
      added++;
      detected = detected.filter((x) => x.key !== d.key);
      await MD.detect.store.mark([d.key]);
    }
    renderDetected();
    return added;
  }

  $('#detAdd').addEventListener('click', async () => {
    const keys = [...root.querySelectorAll('#detList input:checked')].map((c) => c.dataset.key);
    const items = detected.filter((d) => keys.includes(d.key));
    if (!items.length) return;
    const btn = $('#detAdd'); btn.disabled = true;
    const n = await addDetected(items);
    btn.disabled = false;
    if (n) toast(n === 1 ? '✓ 1 devoir ajouté à Mes Devoirs' : '✓ ' + n + ' devoirs ajoutés à Mes Devoirs');
  });
  $('#detIgnore').addEventListener('click', async () => {
    await MD.detect.store.mark(detected.map((d) => d.key));
    detected = []; renderDetected();
  });

  let scanTimer = null;
  async function rescan() {
    opts = await MD.detect.store.get();
    if (!opts.mdDetect || document.hidden) { detected = []; renderDetected(); return; }
    let subj = subjects;
    const found = MD.detect.scan(subj).filter((d) => !opts.mdSeen[d.key]);
    detected = found;
    renderDetected();
    if (opts.mdAuto && found.length) {
      const n = await addDetected(found.slice());
      if (n) toast(n === 1 ? '✓ 1 devoir détecté et ajouté' : '✓ ' + n + ' devoirs détectés et ajoutés');
    }
  }
  const schedule = (ms) => { clearTimeout(scanTimer); scanTimer = setTimeout(rescan, ms); };
  schedule(1800);
  new MutationObserver(() => schedule(1500)).observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(500); });
  try { chrome.storage.onChanged.addListener(() => schedule(300)); } catch (e) { /* pas de storage */ }
  // la liste des matières de l'appli rend la reconnaissance plus précise : on la charge une fois
  send({ type: 'info' }).then((st) => { if (st && st.subjects && st.subjects.length) { subjects = st.subjects; schedule(300); } });
})();
