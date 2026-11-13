// Parle à l'appli Mes Devoirs (serveur local 127.0.0.1) : ajoute un devoir ou vérifie qu'elle répond.
const BASE = 'http://127.0.0.1:47653';
const ping = async () => { try { return (await fetch(BASE + '/ping', { cache: 'no-store' })).ok; } catch (e) { return false; } };

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg && msg.type === 'add') {
    fetch(BASE + '/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg.fields) })
      .then((r) => reply({ ok: r.ok })).catch(() => reply({ ok: false }));
    return true;
  }
  if (msg && msg.type === 'wait') { // l'appli vient d'être lancée : on attend qu'elle réponde (10 s max)
    (async () => {
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (await ping()) return reply({ ok: true });
      }
      reply({ ok: false });
    })();
    return true;
  }
});
