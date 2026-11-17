// Outils communs au panneau (content.js), au popup et au service worker.
(() => {
  const R = (self.MesDevoirs = {});
  R.SITE = 'https://rc9b8hcntp-svg.github.io/mydevoirs/';
  R.DEFAULT_SUBJECTS = [
    { name: 'Maths', color: '#4f6bed' }, { name: 'Français', color: '#e5484d' }, { name: 'Histoire-Géo', color: '#f59e0b' },
    { name: 'Anglais', color: '#a855f7' }, { name: 'Espagnol', color: '#f97316' }, { name: 'SVT', color: '#22a06b' },
    { name: 'Physique-Chimie', color: '#0ea5e9' }, { name: 'Technologie', color: '#14b8a6' }, { name: 'EPS', color: '#84cc16' },
    { name: 'Arts plastiques', color: '#ec4899' }, { name: 'Musique', color: '#64748b' },
  ];
  const pad = (n) => String(n).padStart(2, '0');
  R.ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  R.todayStr = () => R.ymd(new Date());
  R.addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return R.ymd(d); };
  R.dateLabel = (str) => {
    if (!str) return '';
    if (str === R.todayStr()) return "aujourd'hui";
    if (str === R.addDays(1)) return 'demain';
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Analyse du texte sélectionné sur la page : titre, matière, date, priorité, durée, type, étiquettes, notes.
  // Pronote écrit souvent la matière seule sur la première ligne : on la saute pour trouver le vrai titre.
  R.parseSelection = (text, subjects) => {
    const ctx = { today: R.todayStr(), subjects: subjects && subjects.length ? subjects : R.DEFAULT_SUBJECTS };
    const DECO = /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(?=\d{1,2}(?:er)?[\s/.]+[\p{L}\d])/giu;
    const lines = String(text || '').replace(DECO, '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const out = { title: '', subject: '', date: '', priority: 0, minutes: 0, kind: '', tags: [], notes: '' };
    if (!lines.length) return out;
    const whole = QuickAdd.parseQuick(lines.join(' '), ctx);
    out.subject = whole.subject; out.date = whole.date; out.minutes = whole.minutes; out.kind = whole.kind; out.tags = whole.tags;
    out.priority = whole.found.priority ? whole.priority : 0;
    let idx = lines.findIndex((l) => { const r = QuickAdd.parseQuick(l, ctx); return r.title && r.title !== r.subject; });
    if (idx < 0) idx = 0;
    const first = QuickAdd.parseQuick(lines[idx], ctx);
    out.title = (lines.length === 1 ? whole.title : (first.title || lines[idx])).slice(0, 120);
    // les lignes qui ne contiennent que la matière sont déjà prises en compte : pas de doublon dans les notes
    out.notes = lines.filter((l, i) => i !== idx && !(out.subject && QuickAdd.norm(l) === QuickAdd.norm(out.subject)) && (() => { const r = QuickAdd.parseQuick(l, ctx); return !(r.subject && r.title === r.subject); })()).join('\n');
    if (lines.length === 1 && lines[0].length > 120) out.notes = lines[0];
    return out;
  };
})();
