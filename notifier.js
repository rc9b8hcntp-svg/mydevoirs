'use strict';

// Logique des notifications (sans dépendance à Electron, pour pouvoir la tester).

const DEFAULTS = {
  enabled: true,        // rappel quotidien activé
  time: '18:00',        // heure du rappel (HH:MM)
  daysAhead: 1,         // 0 = jour même, 1 = jusqu'à demain, 2, 3, 7…
  includeLate: true,    // inclure les devoirs en retard
  background: true,     // garder l'appli dans la zone de notification quand on ferme la fenêtre
  startup: false,       // lancer au démarrage de Windows
};

const MAX_LINES = 3;

function normalizeSettings(raw) {
  const s = Object.assign({}, DEFAULTS, raw && typeof raw === 'object' ? raw : {});
  s.enabled = !!s.enabled;
  s.includeLate = !!s.includeLate;
  s.background = !!s.background;
  s.startup = !!s.startup;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s.time))) s.time = DEFAULTS.time;
  const d = parseInt(s.daysAhead, 10);
  s.daysAhead = Number.isFinite(d) && d >= 0 && d <= 14 ? d : DEFAULTS.daysAhead;
  return s;
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = String(str).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Nombre de jours entre aujourd'hui et la date (négatif = passé)
function daysUntil(dateStr, now) {
  const target = parseDate(dateStr);
  if (!target) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

function whenLabel(n, dateStr) {
  if (n < -1) return `En retard de ${-n} jours`;
  if (n === -1) return 'En retard (hier)';
  if (n === 0) return "Aujourd'hui";
  if (n === 1) return 'Demain';
  const d = parseDate(dateStr);
  const w = d.toLocaleDateString('fr-FR', { weekday: 'long' });
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function plural(n, one, many) {
  return `${n} ${n > 1 ? many : one}`;
}

// Construit le contenu de la notification, ou null s'il n'y a rien à signaler.
function buildDigest(homework, rawSettings, now = new Date()) {
  const s = normalizeSettings(rawSettings);
  const late = [];
  const soon = [];

  (Array.isArray(homework) ? homework : []).forEach((h) => {
    if (!h || h.done || !h.date || !h.title) return;
    const n = daysUntil(h.date, now);
    if (n === null) return;
    if (n < 0) { if (s.includeLate) late.push({ h, n }); } else if (n <= s.daysAhead) soon.push({ h, n });
  });

  if (late.length === 0 && soon.length === 0) return null;

  const byOrder = (a, b) => (a.n - b.n) || ((b.h.priority || 1) - (a.h.priority || 1));
  soon.sort(byOrder);
  late.sort(byOrder);

  const all = [...soon, ...late];
  const lines = all.slice(0, MAX_LINES).map(({ h, n }) => {
    const prefix = h.subject ? `${h.subject} · ` : '';
    return `${whenLabel(n, h.date)} — ${prefix}${h.title}`;
  });
  if (all.length > MAX_LINES) lines.push(`… et ${plural(all.length - MAX_LINES, 'autre', 'autres')}`);

  const parts = [];
  if (soon.length) parts.push(`${plural(soon.length, 'devoir à rendre', 'devoirs à rendre')}`);
  if (late.length) parts.push(`${plural(late.length, 'en retard', 'en retard')}`);

  return {
    title: parts.join(' · '),
    body: lines.join('\n'),
    filter: soon.length === 0 ? 'late' : 'todo',
  };
}

// Faut-il envoyer le rappel quotidien maintenant ?
// lastSent = date (AAAA-MM-JJ) du dernier rappel déjà traité.
function isDue(rawSettings, lastSent, now = new Date()) {
  const s = normalizeSettings(rawSettings);
  if (!s.enabled) return false;
  if (lastSent === ymd(now)) return false;
  const [h, m] = s.time.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
}

module.exports = { DEFAULTS, normalizeSettings, buildDigest, isDue, ymd };
