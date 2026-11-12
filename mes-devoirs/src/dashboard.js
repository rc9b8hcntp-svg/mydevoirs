'use strict';

// Panneau d'accueil : bonjour, anneau de progression de la semaine et tuiles cliquables.
// Les fonctions et l'état (state, todayStr, isLate, parseDate…) viennent de renderer.js, chargé avant.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const R = 36;
  const CIRC = 2 * Math.PI * R;
  let lastPct = 0;
  let firstDraw = true;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Bonne nuit';
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };
  const weekStart = (str) => shiftDate(str, -((parseDate(str).getDay() + 6) % 7));

  function ring(pct, complete) {
    const wrap = el('div', 'ring' + (complete ? ' full' : ''));
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', 'Progression de la semaine');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 88 88');
    const mk = (cls) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', '44'); c.setAttribute('cy', '44'); c.setAttribute('r', String(R));
      c.setAttribute('class', cls);
      return c;
    };
    const track = mk('trk');
    const bar = mk('bar');
    bar.style.strokeDasharray = String(CIRC);
    bar.style.strokeDashoffset = String(CIRC * (1 - lastPct / 100));
    svg.append(track, bar);
    const label = el('div', 'pct');
    label.append(el('b', null, complete ? '✓' : `${pct}%`), el('small', null, 'Semaine'));
    wrap.append(svg, label);
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.strokeDashoffset = String(CIRC * (1 - pct / 100)); }));
    return wrap;
  }

  function tile(kind, n, label, filter) {
    const b = button('tile ' + kind + (n > 0 ? ' on' : ''));
    b.type = 'button';
    b.append(el('b', null, String(n)), el('span', null, label));
    b.addEventListener('click', () => { state.filter = filter; render(); });
    return b;
  }

  function draw() {
    const box = document.getElementById('hero');
    if (!box) return;
    const show = state.view === 'list' && !state.search;
    box.hidden = !show;
    if (!show) return;

    const today = todayStr();
    const ws = weekStart(today);
    const we = shiftDate(ws, 6);
    const week = state.homework.filter((h) => h.date && h.date >= ws && h.date <= we);
    const weekDone = week.filter((h) => h.done).length;
    const pct = week.length ? Math.round((weekDone / week.length) * 100) : 0;
    const complete = week.length > 0 && weekDone === week.length;
    const todayAll = state.homework.filter((h) => h.date === today);
    const todayLeft = todayAll.filter((h) => !h.done).length;
    const late = state.homework.filter(isLate).length;
    const weekLeft = state.homework.filter((h) => !h.done && h.date && h.date >= today && h.date <= we).length;

    box.classList.toggle('first', firstDraw);
    box.textContent = '';
    box.append(ring(pct, complete));

    const txt = el('div', 'hero-text');
    const d = new Date().toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
    txt.append(el('div', 'hero-eyebrow', d.charAt(0).toUpperCase() + d.slice(1)));
    txt.append(el('div', 'hero-hello', greeting()));
    let sub;
    if (todayLeft > 0) sub = `Il te reste ${todayLeft} devoir${todayLeft > 1 ? 's' : ''} pour aujourd'hui`;
    else if (todayAll.length) sub = "Tout est fait pour aujourd'hui ✨";
    else sub = "Rien de prévu aujourd'hui";
    txt.append(el('div', 'hero-sub', sub));
    box.append(txt);

    const tiles = el('div', 'tiles');
    tiles.append(tile('late', late, 'En retard', 'late'), tile('today', todayLeft, "À faire aujourd'hui", 'today'), tile('week', weekLeft, 'À faire cette semaine', 'week'));
    box.append(tiles);

    lastPct = pct;
    firstDraw = false;
  }

  window.dashboard = { render: draw };
}());
