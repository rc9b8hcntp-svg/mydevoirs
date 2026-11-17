'use strict';

// Ajout rapide en langage naturel : « Maths ex 5 p.12 pour vendredi ! 30 min #groupe »
// Module sans dépendance (utilisable dans la page et dans Node pour les tests).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuickAdd = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const WEEKDAYS = {
    lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7,
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
  };
  const MONTHS = {
    janvier: 1, janv: 1, fevrier: 2, fevr: 2, mars: 3, avril: 4, avr: 4, mai: 5, juin: 6,
    juillet: 7, juil: 7, aout: 8, septembre: 9, sept: 9, octobre: 10, oct: 10, novembre: 11, nov: 11, decembre: 12, dec: 12,
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, june: 6, jun: 6, july: 7, jul: 7,
    august: 8, aug: 8, september: 9, october: 10, november: 11, december: 12,
  };
  // Abréviations courantes, par nom de matière (sans accent, en minuscules)
  const ALIASES = {
    maths: ['math', 'mathematiques', 'mathematique'],
    francais: ['fr', 'franc'],
    'histoire-geo': ['hg', 'histoire', 'geo', 'geographie', 'histoire geo'],
    'physique-chimie': ['pc', 'physique', 'chimie'],
    technologie: ['techno'],
    eps: ['sport'],
    'arts plastiques': ['arts', 'art'],
    anglais: ['english', 'angl'],
    espagnol: ['espa'],
    svt: ['bio', 'biologie'],
    french: ['francais'], history: ['histoire'], music: ['musique'], spanish: ['espagnol'], science: ['sciences'],
  };

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); return fmt(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); };
  const isoDow = (s) => (parse(s).getDay() + 6) % 7 + 1;
  const validDate = (y, m, d) => {
    const x = new Date(y, m - 1, d);
    return x.getFullYear() === y && x.getMonth() === m - 1 && x.getDate() === d;
  };

  // Prochaine date correspondant à jour/mois (cette année, sinon l'année suivante)
  function nextDayMonth(today, day, month) {
    const y = parse(today).getFullYear();
    for (const yy of [y, y + 1]) {
      if (validDate(yy, month, day)) {
        const s = `${yy}-${pad(month)}-${pad(day)}`;
        if (s >= today) return s;
      }
    }
    return null;
  }
  function nextDayOfMonth(today, day) {
    const t = parse(today);
    for (let i = 0; i < 14; i++) {
      const m = new Date(t.getFullYear(), t.getMonth() + i, 1);
      if (validDate(m.getFullYear(), m.getMonth() + 1, day)) {
        const s = `${m.getFullYear()}-${pad(m.getMonth() + 1)}-${pad(day)}`;
        if (s >= today) return s;
      }
    }
    return null;
  }

  function subjectKeys(subjects) {
    const firstWords = new Map();
    subjects.forEach((s) => {
      const w = norm(s.name).split(/[\s-]+/)[0];
      firstWords.set(w, (firstWords.get(w) || 0) + 1);
    });
    return subjects.map((s) => {
      const key = norm(s.name).trim();
      const keys = new Set([key, key.replace(/[-\s]+/g, ' ')]);
      const first = key.split(/[\s-]+/)[0];
      if (first.length >= 3 && firstWords.get(first) === 1) keys.add(first);
      (ALIASES[key] || []).forEach((a) => keys.add(a));
      return { name: s.name, keys: [...keys].map((k) => k.split(/\s+/)).sort((a, b) => b.length - a.length) };
    });
  }

  /**
   * @param {string} input
   * @param {{today: string, subjects?: {name: string}[]}} ctx  today = AAAA-MM-JJ
   */
  function parseQuick(input, ctx) {
    const today = ctx.today;
    const subjects = ctx.subjects || [];
    const toks = String(input || '').trim().split(/\s+/).filter(Boolean).map((raw) => ({
      raw,
      n: norm(raw).replace(/[.,;:!?]+$/, ''),
      used: false,
    }));
    const out = { title: '', subject: '', date: '', priority: 0, kind: '', minutes: 0, tags: [], found: {} };
    const free = (i) => i >= 0 && i < toks.length && !toks[i].used;
    const use = (i, len = 1) => { for (let k = 0; k < len; k++) toks[i + k].used = true; };

    // 1. Étiquettes
    toks.forEach((t, i) => {
      if (/^#[^\s#]/.test(t.raw)) { out.tags.push(t.raw.replace(/^#+/, '').replace(/[.,;:!?]+$/, '').slice(0, 30)); use(i); }
    });

    // 2. Priorité
    toks.forEach((t, i) => {
      if (t.used) return;
      if (/^!{2,}$/.test(t.raw) || t.n === 'urgent' || t.n === 'urgente' || t.n === 'asap') { out.priority = 3; use(i); }
      else if (t.raw === '!' || t.n === 'important' || t.n === 'importante') { out.priority = 2; use(i); }
    });

    // 3. Durée : 30 min, 45min, 1h, 1h30, 2 heures
    for (let i = 0; i < toks.length; i++) {
      if (!free(i)) continue;
      let m = /^(\d{1,2})h(\d{1,2})?$/.exec(toks[i].n);
      if (m) { out.minutes = Number(m[1]) * 60 + Number(m[2] || 0); use(i); break; }
      m = /^(\d{1,3})(?:min|mn|mins|minutes?)$/.exec(toks[i].n);
      if (m) { out.minutes = Number(m[1]); use(i); break; }
      if (/^\d{1,3}$/.test(toks[i].n) && free(i + 1) && /^(min|mn|mins|minutes?)$/.test(toks[i + 1].n)) { out.minutes = Number(toks[i].n); use(i, 2); break; }
      if (/^\d{1,2}$/.test(toks[i].n) && free(i + 1) && /^(heures?|hours?|hrs?)$/.test(toks[i + 1].n)) { out.minutes = Number(toks[i].n) * 60; use(i, 2); break; }
    }
    if (out.minutes > 1440) out.minutes = 1440;

    // 4. Date
    const setDate = (start, len, date) => {
      if (!date) return false;
      // « pour », « le », « avant » juste devant
      let s = start;
      while (s > 0 && free(s - 1) && /^(pour|le|avant|du|au|for|due|on|by|before)$/.test(toks[s - 1].n)) s--;
      use(s, start + len - s);
      out.date = date;
      return true;
    };
    for (let i = 0; i < toks.length && !out.date; i++) {
      if (!free(i)) continue;
      const t = toks[i].n;
      let m;
      if (/^\d{4}-\d{2}-\d{2}$/.test(t) && validDate(+t.slice(0, 4), +t.slice(5, 7), +t.slice(8))) { setDate(i, 1, t); continue; }
      if ((m = /^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?$/.exec(t))) {
        const d = Number(m[1]); const mo = Number(m[2]);
        if (m[3]) {
          const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
          if (validDate(y, mo, d)) setDate(i, 1, `${y}-${pad(mo)}-${pad(d)}`);
        } else if (mo >= 1 && mo <= 12) {
          setDate(i, 1, nextDayMonth(today, d, mo));
        }
        continue;
      }
      if (/^(aujourd'?hui|today)$/.test(t)) { setDate(i, 1, today); continue; }
      if (t === 'demain' || t === 'tomorrow') { setDate(i, 1, addDays(today, 1)); continue; }
      if (t === 'apres-demain' || t === 'apresdemain') { setDate(i, 1, addDays(today, 2)); continue; }
      if (t === 'apres' && free(i + 1) && toks[i + 1].n === 'demain') { setDate(i, 2, addDays(today, 2)); continue; }
      if ((t === 'dans' || t === 'in') && free(i + 1) && /^\d{1,3}$/.test(toks[i + 1].n) && free(i + 2)) {
        const n = Number(toks[i + 1].n);
        const u = toks[i + 2].n;
        if (/^(jours?|days?)$/.test(u)) { setDate(i, 3, addDays(today, n)); continue; }
        if (/^(semaines?|weeks?)$/.test(u)) { setDate(i, 3, addDays(today, 7 * n)); continue; }
        if (u === 'mois' || /^months?$/.test(u)) {
          const d = parse(today);
          const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
          setDate(i, 3, fmt(new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last))));
          continue;
        }
      }
      if (WEEKDAYS[t]) {
        let diff = (WEEKDAYS[t] - isoDow(today) + 7) % 7;
        if (diff === 0) diff = 7;
        let len = 1;
        let startAt = i;
        if (free(i - 1) && toks[i - 1].n === 'next') { len = 2; startAt = i - 1; if (isoDow(today) + diff <= 7) diff += 7; }
        else if (free(i + 1) && /^(prochaine?|next)$/.test(toks[i + 1].n)) {
          len = 2;
          if (isoDow(today) + diff <= 7) diff += 7; // « lundi prochain » = la semaine suivante
        }
        setDate(startAt, len, addDays(today, diff));
        continue;
      }
      // « 15 novembre », « le 3 mai »
      if (/^\d{1,2}(er|st|nd|rd|th)?$/.test(t) && free(i + 1) && MONTHS[toks[i + 1].n]) {
        const day = Number(t.replace(/\D/g, ''));
        let len = 2;
        let date = nextDayMonth(today, day, MONTHS[toks[i + 1].n]);
        if (free(i + 2) && /^\d{4}$/.test(toks[i + 2].n)) {
          const y = Number(toks[i + 2].n);
          date = validDate(y, MONTHS[toks[i + 1].n], day) ? `${y}-${pad(MONTHS[toks[i + 1].n])}-${pad(day)}` : null;
          len = 3;
        }
        setDate(i, len, date);
        continue;
      }
      if (MONTHS[t] && free(i + 1) && /^\d{1,2}(st|nd|rd|th)?$/.test(toks[i + 1].n)) {
        setDate(i, 2, nextDayMonth(today, Number(toks[i + 1].n.replace(/\D/g, '')), MONTHS[t]));
        continue;
      }
      // « le 15 » (jour du mois seul, introduit par « le »)
      if (/^\d{1,2}$/.test(t) && i > 0 && free(i - 1) && toks[i - 1].n === 'le' && !(free(i + 1) && /^(min|mn|mins|minutes?|heures?|h)$/.test(toks[i + 1].n))) {
        if (Number(t) >= 1 && Number(t) <= 31) setDate(i, 1, nextDayOfMonth(today, Number(t)));
      }
    }

    // 5. Matière (nom, nom sans tiret, premier mot, abréviation)
    const keys = subjectKeys(subjects);
    outer:
    for (let len = 4; len >= 1; len--) {
      for (let i = 0; i + len <= toks.length; i++) {
        for (let k = 0; k < len; k++) if (!free(i + k)) continue outer;
        const seq = toks.slice(i, i + len).map((t) => t.n.replace(/[^a-z0-9'-]/g, ''));
        for (const s of keys) {
          if (s.keys.some((kk) => kk.length === len && kk.every((w, j) => w === seq[j] || w === seq[j].replace(/-/g, ' ')))) {
            out.subject = s.name;
            use(i, len);
            break outer;
          }
        }
      }
    }

    // 6. Type
    const words = toks.map((t) => t.n);
    if (words.some((w) => /^(controle|interro|interrogation|ds|evaluation|eval|test|quiz|exam)$/.test(w))) out.kind = 'controle';
    else if (words.some((w) => /^(expose|presentation|oral|talk)$/.test(w))) out.kind = 'expose';

    // 7. Titre : ce qui reste
    let title = toks.filter((t) => !t.used).map((t) => t.raw).join(' ').replace(/\s+/g, ' ').trim();
    title = title.replace(/^[-–—:,;\s]+|[-–—:,;\s]+$/g, '').replace(/^(pour|de|du|en|for)\s+/i, '').replace(/\s+(pour|le|avant|de|for|due|on|by)$/i, '').trim();
    if (!title) title = out.subject ? out.subject : '';
    out.title = title ? title.charAt(0).toUpperCase() + title.slice(1) : '';

    out.found = {
      subject: !!out.subject, date: !!out.date, priority: out.priority > 0, kind: !!out.kind, minutes: out.minutes > 0, tags: out.tags.length > 0,
    };
    if (!out.priority) out.priority = 1;
    return out;
  }

  return { parseQuick, norm };
}));
