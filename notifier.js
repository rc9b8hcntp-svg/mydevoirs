'use strict';

// Logique des notifications (sans dépendance à Electron, pour pouvoir la tester).

const DEFAULTS = {
  enabled: true,        // rappel quotidien activé
  time: '18:00',        // heure du rappel (HH:MM)
  daysAhead: 1,         // 0 = jour même, 1 = jusqu'à demain, 2, 3, 7…
  includeLate: true,    // inclure les devoirs en retard
  background: true,     // garder l'appli dans la zone de notification quand on ferme la fenêtre
  startup: false,       // lancer au démarrage de Windows
  dueReminder: false,   // 11. une notification par devoir, la veille de l'échéance
  dueTime: '18:00',     //     heure de ce rappel
  actions: true,        // 12. boutons « Marquer fait » / « Rappeler demain » dans la notification
  morning: false,       // 13. rappel du matin (« tes devoirs du jour »)
  morningTime: '07:30',
  vacation: false,      // 14. mode vacances : coupe tous les rappels entre deux dates
  vacationFrom: '',     //     AAAA-MM-JJ
  vacationTo: '',
  sound: 'default',     // 15. son de la notification (voir SOUNDS)
};

// Sons Windows disponibles (null = notification silencieuse)
const SOUNDS = {
  default: 'Notification.Default',
  reminder: 'Notification.Reminder',
  im: 'Notification.IM',
  mail: 'Notification.Mail',
  sms: 'Notification.SMS',
  silent: null,
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URL_SCHEME = 'mesdevoirs';

const MAX_LINES = 3;

function normalizeSettings(raw) {
  const s = Object.assign({}, DEFAULTS, raw && typeof raw === 'object' ? raw : {});
  s.enabled = !!s.enabled;
  s.includeLate = !!s.includeLate;
  s.background = !!s.background;
  s.startup = !!s.startup;
  s.dueReminder = !!s.dueReminder;
  s.actions = !!s.actions;
  s.morning = !!s.morning;
  s.vacation = !!s.vacation;
  if (!TIME_RE.test(String(s.time))) s.time = DEFAULTS.time;
  if (!TIME_RE.test(String(s.dueTime))) s.dueTime = DEFAULTS.dueTime;
  if (!TIME_RE.test(String(s.morningTime))) s.morningTime = DEFAULTS.morningTime;
  if (!DATE_RE.test(String(s.vacationFrom))) s.vacationFrom = '';
  if (!DATE_RE.test(String(s.vacationTo))) s.vacationTo = '';
  if (!Object.prototype.hasOwnProperty.call(SOUNDS, s.sound)) s.sound = DEFAULTS.sound;
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

// 14. Mode vacances : vrai si on est entre les deux dates (incluses)
function isPaused(rawSettings, now = new Date()) {
  const s = normalizeSettings(rawSettings);
  if (!s.vacation || !s.vacationFrom || !s.vacationTo) return false;
  const today = ymd(now);
  return today >= s.vacationFrom && today <= s.vacationTo;
}

function minutesOf(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Une heure quotidienne est-elle passée et pas encore traitée aujourd'hui ?
// graceMin : au-delà de ce délai après l'heure prévue, on laisse tomber (inutile d'envoyer « ce matin » à 20h).
function isDueAt(time, lastSent, now = new Date(), graceMin = Infinity) {
  if (lastSent === ymd(now)) return false;
  const diff = now.getHours() * 60 + now.getMinutes() - minutesOf(time);
  return diff >= 0 && diff <= graceMin;
}

// 13. Rappel du matin : devoirs du jour (+ en retard si l'option est active)
function buildMorning(homework, rawSettings, now = new Date()) {
  const s = normalizeSettings(rawSettings);
  const today = [];
  const late = [];
  (Array.isArray(homework) ? homework : []).forEach((h) => {
    if (!h || h.done || !h.date || !h.title) return;
    const n = daysUntil(h.date, now);
    if (n === 0) today.push(h); else if (n !== null && n < 0 && s.includeLate) late.push(h);
  });
  if (!today.length && !late.length) return null;
  const line = (h) => (h.subject ? `${h.subject} · ` : '') + h.title;
  const lines = [...today, ...late].slice(0, MAX_LINES).map(line);
  const total = today.length + late.length;
  if (total > MAX_LINES) lines.push(`… et ${plural(total - MAX_LINES, 'autre', 'autres')}`);
  const parts = [];
  if (today.length) parts.push(`Tes devoirs du jour : ${today.length}`);
  if (late.length) parts.push(`${late.length} en retard`);
  return { title: parts.join(' · '), body: lines.join('\n'), filter: today.length ? 'today' : 'late' };
}

// 11. Notification propre à un devoir (veille de l'échéance, ou rappel reporté)
function buildReminder(h, now = new Date()) {
  const n = daysUntil(h.date, now);
  const when = n === null ? '' : whenLabel(n, h.date);
  return {
    title: (h.subject ? `${h.subject} · ` : '') + h.title,
    body: n === 1 ? 'À rendre demain' : when || 'Rappel',
    filter: 'todo',
    homeworkId: h.id,
  };
}

// Devoirs à rendre demain, pas encore faits
function dueTomorrow(homework, now = new Date()) {
  return (Array.isArray(homework) ? homework : []).filter(
    (h) => h && !h.done && h.id && h.title && h.date && daysUntil(h.date, now) === 1
  );
}

function actionUrl(action, id) {
  return `${URL_SCHEME}://${action}/${encodeURIComponent(id)}`;
}

// Lit une adresse mesdevoirs://done/ID ou mesdevoirs://snooze/ID
function parseActionUrl(arg) {
  const add = /^mesdevoirs:\/\/add\/?\?(.*)$/i.exec(String(arg || ''));
  if (add) {
    try {
      const q = new URLSearchParams(add[1]);
      const title = String(q.get('title') || '').trim().slice(0, 120);
      if (!title) return null;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get('date') || '') ? q.get('date') : '';
      return { action: 'add', fields: { title, subject: String(q.get('subject') || '').trim().slice(0, 60), date, notes: String(q.get('notes') || '').trim().slice(0, 2000) } };
    } catch (e) { return null; }
  }
  const m = /^mesdevoirs:\/\/(done|snooze)\/([^/?#\s]+)\/?$/i.exec(String(arg || ''));
  if (!m) return null;
  try { return { action: m[1].toLowerCase(), id: decodeURIComponent(m[2]) }; } catch (e) { return null; }
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 12 + 15. Notification Windows complète (texte, boutons, son)
function buildToastXml({ title, body, sound, actions }) {
  const snd = Object.prototype.hasOwnProperty.call(SOUNDS, sound) ? SOUNDS[sound] : SOUNDS.default;
  const lines = String(body || '').split('\n').filter(Boolean).map((l) => `<text>${esc(l)}</text>`).join('');
  const buttons = (actions || [])
    .map((a) => `<action content="${esc(a.label)}" arguments="${esc(a.url)}" activationType="protocol"/>`)
    .join('');
  const audio = snd ? `<audio src="ms-winsoundevent:${snd}"/>` : '<audio silent="true"/>';
  return `<toast><visual><binding template="ToastGeneric"><text>${esc(title)}</text>${lines}</binding></visual>` +
    (buttons ? `<actions>${buttons}</actions>` : '') + `${audio}</toast>`;
}

module.exports = {
  DEFAULTS, SOUNDS, normalizeSettings, buildDigest, isDue, ymd,
  isPaused, isDueAt, buildMorning, buildReminder, dueTomorrow, actionUrl, parseActionUrl, buildToastXml, daysUntil,
};
