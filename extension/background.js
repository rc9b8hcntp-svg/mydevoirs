// Parle à l'appli Mes Devoirs (serveur local 127.0.0.1) : ajoute un devoir, lit ses infos, ou vérifie qu'elle répond.
importScripts('quickadd.js', 'shared.js');
const BASE = 'http://127.0.0.1:47653';

async function api(path, opts, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms || 3000);
  try { return await fetch(BASE + path, Object.assign({ cache: 'no-store', signal: ctl.signal }, opts)); } finally { clearTimeout(t); }
}
const ping = async () => { try { return (await api('/ping')).ok; } catch (e) { return false; } };

// État de l'appli : répond-elle, quelles sont ses matières, combien de devoirs aujourd'hui.
// Une ancienne version de l'appli n'a pas /info : on retombe sur /ping.
async function info() {
  try {
    const r = await api('/info', null, 2500);
    if (r.ok) return Object.assign({ ok: true }, await r.json());
  } catch (e) { /* on essaie /ping */ }
  return { ok: await ping(), subjects: null, counts: null };
}

async function add(fields) {
  try {
    const r = await api('/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) }, 5000);
    return { ok: r.ok };
  } catch (e) { return { ok: false }; }
}

async function waitForApp() { // l'appli vient d'être lancée : on attend qu'elle réponde (12 s max)
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await ping()) return { ok: true };
  }
  return { ok: false };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (!msg) return;
  if (msg.type === 'add') { add(msg.fields).then(reply); return true; }
  if (msg.type === 'wait') { waitForApp().then(reply); return true; }
  if (msg.type === 'info') { info().then(reply); return true; }
});

// Pastille sur l'icône de l'extension : ✓ vert (ajouté) ou ! rouge (appli injoignable)
let badgeTimer = null;
function flash(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3500);
}

// Clic droit sur du texte sélectionné, n'importe où : ajout direct (matière, date, priorité… reconnues dans le texte)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'md-add', title: 'Ajouter « %s » à Mes Devoirs', contexts: ['selection'] });
});
chrome.contextMenus.onClicked.addListener(async (data) => {
  if (data.menuItemId !== 'md-add') return;
  const state = await info();
  const f = MesDevoirs.parseSelection(data.selectionText, state.subjects);
  if (!f.title) return flash('!', '#e5484d');
  const r = state.ok ? await add(f) : { ok: false };
  flash(r.ok ? '✓' : '!', r.ok ? '#22a06b' : '#e5484d');
});

// Raccourci clavier : ouvre / ferme le panneau d'ajout de la page
chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== 'toggle-panel') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id != null) chrome.tabs.sendMessage(tab.id, { type: 'toggle' }).catch(() => { /* page sans le panneau */ });
});
