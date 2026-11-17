// Popup de l'extension : état de l'appli, compteurs, et ajout rapide en une phrase.
const MD = self.MesDevoirs;
const $ = (id) => document.getElementById(id);
let subjects = MD.DEFAULT_SUBJECTS;
let appOk = false;
const send = async (m) => { try { return await chrome.runtime.sendMessage(m); } catch (e) { return null; } };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const parse = () => QuickAdd.parseQuick($('q').value, { today: MD.todayStr(), subjects });

function note(text, ok, link) {
  const n = $('note');
  n.hidden = !text;
  n.className = 'note' + (ok ? ' ok' : '');
  n.textContent = text || '';
  if (link) { const a = el('a', null, 'Télécharger Mes Devoirs'); a.href = MD.SITE; a.target = '_blank'; a.rel = 'noopener'; n.append(document.createElement('br'), a); }
}

function renderPreview() {
  const box = $('preview');
  box.textContent = '';
  box.hidden = !$('q').value.trim();
  if (box.hidden) return;
  const r = parse();
  if (!r.title) { box.append(el('span', null, 'Ajoute au moins un titre.')); return; }
  box.append(el('span', 't', r.title));
  if (r.subject) {
    const c = el('span', 'chip c2', r.subject);
    const s = subjects.find((x) => x.name === r.subject);
    c.style.setProperty('--c', (s && s.color) || '#8b93a7');
    box.append(c);
  }
  if (r.date) box.append(el('span', 'chip', MD.dateLabel(r.date)));
  if (r.found.priority) box.append(el('span', 'chip', r.priority === 3 ? 'urgent' : 'important'));
  if (r.kind) box.append(el('span', 'chip', r.kind === 'controle' ? 'contrôle' : 'exposé'));
  if (r.minutes) box.append(el('span', 'chip', r.minutes + ' min'));
  r.tags.forEach((t) => box.append(el('span', 'chip', '#' + t)));
}

async function status() {
  const st = await send({ type: 'info' });
  appOk = !!(st && st.ok);
  $('dot').className = 'dot ' + (appOk ? 'on' : 'off');
  $('stxt').textContent = appOk ? 'Appli connectée' : 'Appli non lancée';
  if (st && st.subjects && st.subjects.length) subjects = st.subjects;
  if (st && st.counts) {
    $('counts').hidden = false;
    $('cLate').textContent = st.counts.late;
    $('cToday').textContent = st.counts.today;
    $('cTomorrow').textContent = st.counts.tomorrow;
  }
  renderPreview();
}

$('q').addEventListener('input', renderPreview);
$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!$('q').value.trim()) return;
  const r = parse();
  if (!r.title) { note('Ajoute au moins un titre.'); return; }
  const fields = { title: r.title, subject: r.subject, date: r.date, notes: '', priority: r.found.priority ? r.priority : 0, minutes: r.minutes, kind: r.kind, tags: r.tags };
  $('go').disabled = true;
  let res = await send({ type: 'add', fields });
  if (!(res && res.ok)) {
    note('Ouverture de Mes Devoirs…');
    const q = new URLSearchParams({ title: fields.title, subject: fields.subject, date: fields.date, notes: '' });
    if (fields.priority) q.set('priority', String(fields.priority));
    if (fields.minutes) q.set('minutes', String(fields.minutes));
    if (fields.kind) q.set('kind', fields.kind);
    chrome.tabs.create({ url: 'mesdevoirs://add?' + q.toString(), active: false }).then((t) => setTimeout(() => chrome.tabs.remove(t.id).catch(() => {}), 2500)).catch(() => {});
    res = await send({ type: 'wait' });
  }
  $('go').disabled = false;
  if (res && res.ok) { note('✓ Ajouté : « ' + fields.title + ' »', true); $('q').value = ''; renderPreview(); status(); }
  else note("Mes Devoirs n'a pas répondu : l'appli n'est probablement pas installée.", false, true);
});
status();

// Réglages de la détection automatique (partagés avec les pages Pronote / École Directe)
(async () => {
  let r = { mdDetect: true, mdAuto: false };
  try { r = await chrome.storage.local.get(r); } catch (e) { /* pas de storage */ }
  $('oDetect').checked = r.mdDetect;
  $('oAuto').checked = r.mdAuto;
  $('oAuto').disabled = !r.mdDetect;
  $('oDetect').addEventListener('change', () => { $('oAuto').disabled = !$('oDetect').checked; chrome.storage.local.set({ mdDetect: $('oDetect').checked }); });
  $('oAuto').addEventListener('change', () => chrome.storage.local.set({ mdAuto: $('oAuto').checked }));
})();
