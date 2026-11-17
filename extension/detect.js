// Détection automatique des devoirs affichés sur la page (Pronote, École Directe…).
// Principe : on cherche les plus petits blocs de texte qui parlent d'un travail (« à faire », « exercices », « contrôle »…)
// ET qui donnent une date à venir. Rien n'est ajouté sans ton accord, sauf si tu actives l'ajout automatique.
(() => {
  const MD = self.MesDevoirs;
  const KEY = /(travail\s+à\s+faire|à\s+faire|a\s+faire|à\s+rendre|à\s+préparer|à\s+apprendre|à\s+lire|devoirs?\b|exercices?|leçons?|apprendre|réviser|révisions?|contr[ôo]le|interro(?:gation)?s?\b|évaluation|\bDS\b|\bDM\b|exposé|rédaction)/i;
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'NAV', 'HEADER', 'FOOTER', 'BUTTON']);
  const LABEL = /^\s*(?:travail\s+à\s+faire|à\s+faire|a\s+faire|devoirs?|pour\s+(?:le\s+)?[^:–-]{0,28})\s*[:–-]\s*/i;

  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const visible = (el) => (el.checkVisibility ? el.checkVisibility() : el.offsetParent !== null);
  const skipped = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) if (SKIP_TAGS.has(n.tagName)) return true; return false; };

  function scan(subjects) {
    if (!document.body) return [];
    const today = MD.todayStr();
    const pool = [];
    for (const el of document.body.querySelectorAll('li, tr, article, p, section, div, span, td, a')) {
      const t = el.textContent;
      if (t.length < 12 || t.length > 600 || !KEY.test(t)) continue;
      pool.push(el);
      if (pool.length > 400) break;
    }
    // les plus petits blocs seulement (pas le conteneur qui les englobe)
    const deepest = pool.filter((el) => !pool.some((o) => o !== el && el.contains(o)));
    const out = [];
    const seen = new Set();
    for (const el of deepest.slice(0, 60)) {
      if (skipped(el) || !visible(el)) continue;
      let node = el;
      let f = null;
      for (let up = 0; up < 4 && node; up++, node = node.parentElement) {
        if (node === document.body || node.textContent.length > 500) break;
        const f2 = MD.parseSelection(node.innerText || '', subjects);
        if (f2.title && f2.date) { f = f2; break; } // on remonte jusqu'au bloc qui donne la date
      }
      if (!f || f.date < today || f.date > MD.addDays(150)) continue; // pas de date à venir (ou « 3 novembre » déjà passé, lu comme l'an prochain) : on ne propose pas
      f.title = f.title.replace(LABEL, '').trim();
      if (f.title.length < 4) continue;
      f.title = f.title.charAt(0).toUpperCase() + f.title.slice(1);
      if (!f.subject) { // la matière est souvent dans un bloc parent : on regarde sa première ligne
        let a = el.parentElement;
        for (let up = 0; up < 4 && a && !f.subject; up++, a = a.parentElement) {
          const first = String(a.innerText || '').trim().split(/\n+/)[0] || '';
          if (first.length < 40) f.subject = QuickAdd.parseQuick(first, { today, subjects }).subject;
        }
      }
      f.key = hash(norm(f.title) + '|' + f.date + '|' + norm(f.subject));
      if (seen.has(f.key)) continue;
      seen.add(f.key);
      out.push(f);
      if (out.length >= 30) break;
    }
    return out;
  }

  // Mémoire : devoirs déjà ajoutés ou ignorés (pour ne pas les reproposer) et réglages
  const store = {
    async get() {
      try { const r = await chrome.storage.local.get({ mdSeen: {}, mdDetect: true, mdAuto: false }); return r; } catch (e) { return { mdSeen: {}, mdDetect: true, mdAuto: false }; }
    },
    async mark(keys) {
      try {
        const { mdSeen } = await chrome.storage.local.get({ mdSeen: {} });
        const now = Date.now();
        Object.keys(mdSeen).forEach((k) => { if (now - mdSeen[k] > 60 * 864e5) delete mdSeen[k]; });
        keys.forEach((k) => { mdSeen[k] = now; });
        await chrome.storage.local.set({ mdSeen });
      } catch (e) { /* tant pis */ }
    },
  };

  MD.detect = { scan, store, hash, norm };
})();
