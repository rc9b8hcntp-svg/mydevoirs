// Bouton flottant « + Mes Devoirs » sur Pronote / École Directe.
// Astuce : sélectionne le texte du devoir sur la page avant de cliquer, il sera pré-rempli.
(() => {
  if (window.top !== window || document.getElementById('mesdevoirs-ext')) return;

  const host = document.createElement('div');
  host.id = 'mesdevoirs-ext';
  host.style.cssText = 'all:initial;position:fixed;right:18px;bottom:18px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
  <style>
    *{box-sizing:border-box;font-family:system-ui,Segoe UI,sans-serif}
    .fab{width:48px;height:48px;border-radius:50%;border:0;background:#4f46e5;color:#fff;font-size:26px;cursor:pointer;box-shadow:0 4px 14px #0005}
    .fab:hover{background:#4338ca}
    .panel{display:none;position:absolute;right:0;bottom:58px;width:290px;background:#fff;color:#111;border-radius:12px;padding:12px;box-shadow:0 8px 28px #0006}
    .panel.open{display:block}
    h4{margin:0 0 8px;font-size:14px}
    label{display:block;font-size:11px;color:#555;margin:6px 0 2px}
    input,textarea{width:100%;border:1px solid #ccc;border-radius:6px;padding:6px;font-size:13px;color:#111;background:#fff}
    textarea{height:60px;resize:vertical}
    .row{display:flex;gap:6px;margin-top:10px}
    button.ok{flex:1;background:#4f46e5;color:#fff;border:0;border-radius:6px;padding:8px;cursor:pointer;font-size:13px}
    button.no{background:#eee;color:#111;border:0;border-radius:6px;padding:8px;cursor:pointer;font-size:13px}
    .msg{display:none;margin-top:8px;padding:8px;border-radius:6px;font-size:12px;line-height:1.4;background:#fef3c7;color:#78350f}
    .msg.ok{background:#dcfce7;color:#14532d}
    .msg a{display:inline-block;margin-top:6px;background:#4f46e5;color:#fff;padding:6px 10px;border-radius:6px;text-decoration:none;font-weight:600}
    .hint{font-size:11px;color:#777;margin-top:6px}
  </style>
  <button class="fab" title="Ajouter à Mes Devoirs">+</button>
  <div class="panel">
    <h4>Ajouter à Mes Devoirs</h4>
    <label>Titre</label><input id="t" maxlength="120">
    <label>Matière</label><input id="s" maxlength="60">
    <label>Pour le</label><input id="d" type="date">
    <label>Notes</label><textarea id="n"></textarea>
    <div class="row"><button class="ok">Ajouter</button><button class="no">Annuler</button></div>
    <div class="msg" id="m"></div>
    <div class="hint">Astuce : sélectionne le texte du devoir avant de cliquer sur +.</div>
  </div>`;
  document.documentElement.appendChild(host);

  const $ = (s) => root.querySelector(s);
  const panel = $('.panel');
  let lastSel = '';
  document.addEventListener('selectionchange', () => {
    const t = String(window.getSelection() || '').trim();
    if (t) lastSel = t;
  });

  const open = () => {
    const sel = lastSel; lastSel = '';
    const lines = sel.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    $('#t').value = (lines[0] || '').slice(0, 120);
    $('#n').value = lines.slice(1).join('\n') || (lines[0] && lines[0].length > 120 ? lines[0] : '');
    $('#m').style.display = 'none';
    panel.classList.add('open');
    $('#t').focus();
  };
  const close = () => panel.classList.remove('open');

  $('.fab').addEventListener('click', () => (panel.classList.contains('open') ? close() : open()));
  $('.no').addEventListener('click', close);
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); e.stopPropagation(); });

  const SITE = 'https://rc9b8hcntp-svg.github.io/mydevoirs/';
  const send = async (msg) => { try { return await chrome.runtime.sendMessage(msg); } catch (e) { return null; } };
  const msg = (text, kind) => { const m = $('#m'); m.className = 'msg' + (kind ? ' ' + kind : ''); m.textContent = text; m.style.display = 'block'; return m; };

  $('.ok').addEventListener('click', async () => {
    const title = $('#t').value.trim();
    if (!title) { $('#t').focus(); return; }
    const fields = { title, subject: $('#s').value.trim(), date: $('#d').value, notes: $('#n').value.trim() };
    const btn = $('.ok'); btn.disabled = true;
    const done = () => { msg('✓ Ajouté à Mes Devoirs', 'ok'); btn.disabled = false; setTimeout(close, 1500); };

    // 1) l'appli est déjà lancée : ajout direct, sans rien ouvrir
    let r = await send({ type: 'add', fields });
    if (r && r.ok) return done();

    // 2) pas de réponse : on essaie de la lancer (si elle est installée), puis on attend qu'elle réponde
    msg('Ouverture de Mes Devoirs…');
    const a = document.createElement('a');
    a.href = 'mesdevoirs://add?' + new URLSearchParams(fields).toString();
    root.appendChild(a); a.click(); a.remove();
    r = await send({ type: 'wait' });
    if (r && r.ok) return done();

    // 3) toujours rien : l'appli n'est sûrement pas installée
    btn.disabled = false;
    const m = msg("Mes Devoirs n'a pas répondu : l'appli n'est probablement pas installée sur cet ordinateur. L'extension a besoin de l'appli (gratuite) pour enregistrer tes devoirs. Installe-la, puis recommence.");
    const dl = document.createElement('a');
    dl.href = SITE; dl.target = '_blank'; dl.rel = 'noopener'; dl.textContent = 'Télécharger Mes Devoirs';
    m.appendChild(document.createElement('br')); m.appendChild(dl);
  });
})();
