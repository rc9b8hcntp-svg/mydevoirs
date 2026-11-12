'use strict';

// Lecture d'un fichier .ics (agenda) et calcul des cours qui tombent dans une période.
// Sans dépendance, sans Electron : testable seul (voir tests/).
//
// Gère : DTSTART / DTEND / DURATION, fuseaux horaires (TZID), heures UTC (Z) et « flottantes »,
// RRULE (DAILY, WEEKLY, MONTHLY, YEARLY avec INTERVAL, BYDAY, BYMONTHDAY, BYMONTH, COUNT, UNTIL, WKST),
// EXDATE, RDATE, RECURRENCE-ID (cours déplacé) et STATUS:CANCELLED (cours annulé).
// Les événements « toute la journée » sont ignorés (ils n'ont pas d'heure).

const DAY_MS = 86400000;
const MAX_EVENTS = 5000;

const WIN_TZ = {
  'romance standard time': 'Europe/Paris',
  'w. europe standard time': 'Europe/Berlin',
  'central europe standard time': 'Europe/Budapest',
  'central european standard time': 'Europe/Warsaw',
  'gmt standard time': 'Europe/London',
  'greenwich standard time': 'Atlantic/Reykjavik',
  'e. europe standard time': 'Europe/Chisinau',
  'utc': 'UTC',
  'eastern standard time': 'America/New_York',
  'central standard time': 'America/Chicago',
  'mountain standard time': 'America/Denver',
  'pacific standard time': 'America/Los_Angeles',
  'canada central standard time': 'America/Regina',
  'e. south america standard time': 'America/Sao_Paulo',
  'sa pacific standard time': 'America/Bogota',
  'sa eastern standard time': 'America/Cayenne',
  'sa western standard time': 'America/La_Paz',
  'w. central africa standard time': 'Africa/Lagos',
  'morocco standard time': 'Africa/Casablanca',
  'south africa standard time': 'Africa/Johannesburg',
  'arabian standard time': 'Asia/Dubai',
  'tahiti standard time': 'Pacific/Tahiti',
  'la reunion standard time': 'Indian/Reunion',
  'indian ocean standard time': 'Indian/Reunion',
  'new caledonia standard time': 'Pacific/Noumea',
};

function localTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
}

const tzCache = new Map();
function dtf(tz) {
  let f = tzCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    tzCache.set(tz, f);
  }
  return f;
}

function validTz(tz) {
  try { dtf(tz); return true; } catch (e) { return false; }
}

// Nom de fuseau d'un fichier ics → nom IANA utilisable (sinon fuseau de l'ordinateur)
function resolveTz(raw, fallback) {
  const fb = fallback || localTz();
  if (!raw) return fb;
  let t = String(raw).trim().replace(/^"|"$/g, '');
  if (validTz(t)) return t;
  const win = WIN_TZ[t.toLowerCase()];
  if (win) return win;
  // « /mozilla.org/20050126_1/Europe/Paris » → « Europe/Paris »
  const parts = t.split('/');
  for (let n = Math.min(parts.length, 3); n >= 1; n--) {
    const cand = parts.slice(-n).join('/');
    if (validTz(cand)) return cand;
  }
  return fb;
}

// Décalage (ms) du fuseau tz à l'instant ms : heure locale du fuseau − heure UTC
function tzOffset(ms, tz) {
  const p = {};
  dtf(tz).formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

// Heure « murale » (y, m = 1..12, d, h, mi, s) dans le fuseau tz → instant (ms depuis 1970)
function wallToMs(y, m, d, h, mi, s, tz) {
  const guess = Date.UTC(y, m - 1, d, h, mi, s);
  let ms = guess - tzOffset(guess, tz);
  const off2 = tzOffset(ms, tz);
  if (guess - off2 !== ms) ms = guess - off2;
  return ms;
}

// ---------- Lecture du fichier ----------
function unfold(text) {
  return String(text || '').replace(/^﻿/, '').replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
}

function unescapeText(s) {
  return String(s || '').replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').replace(/\s+/g, ' ').trim();
}

function splitLine(line) {
  // NOM;PARAM=val;PARAM="v:al":valeur
  let inQ = false;
  let idx = -1;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQ = !inQ;
    else if (c === ':' && !inQ) { idx = i; break; }
  }
  if (idx < 0) return null;
  const head = line.slice(0, idx);
  const value = line.slice(idx + 1);
  const parts = [];
  let cur = '';
  inQ = false;
  for (const c of head) {
    if (c === '"') { inQ = !inQ; cur += c; } else if (c === ';' && !inQ) { parts.push(cur); cur = ''; } else cur += c;
  }
  parts.push(cur);
  const name = parts.shift().toUpperCase();
  const params = {};
  parts.forEach((p) => {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  });
  return { name, params, value };
}

// « 20261112T083000Z » / « 20261112T083000 » / « 20261112 » → champs
function parseDateValue(value, params) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/i.exec(String(value).trim());
  if (!m) return null;
  const allDay = m[4] === undefined || (params && params.VALUE === 'DATE');
  return {
    y: +m[1], m: +m[2], d: +m[3], h: allDay ? 0 : +m[4], mi: allDay ? 0 : +m[5], s: allDay ? 0 : +(m[6] || 0),
    utc: !!m[7], tzid: params && params.TZID ? params.TZID : '', allDay,
  };
}

function parseDuration(v) {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(String(v).trim());
  if (!m) return null;
  const ms = ((+m[2] || 0) * 7 * 24 * 3600 + (+m[3] || 0) * 24 * 3600 + (+m[4] || 0) * 3600 + (+m[5] || 0) * 60 + (+m[6] || 0)) * 1000;
  return m[1] === '-' ? -ms : ms;
}

function parseRrule(v) {
  const r = {};
  String(v).split(';').forEach((kv) => {
    const eq = kv.indexOf('=');
    if (eq > 0) r[kv.slice(0, eq).toUpperCase()] = kv.slice(eq + 1);
  });
  return r;
}

/**
 * @param {string} text contenu du fichier .ics
 * @returns {object[]} événements bruts (voir expand pour obtenir les cours d'une période)
 */
function parseIcs(text) {
  const events = [];
  let ev = null;
  for (const line of unfold(text)) {
    if (/^BEGIN:VEVENT\s*$/i.test(line)) { ev = { summary: '', location: '', uid: '', exdates: [], rdates: [], status: '' }; continue; }
    if (/^END:VEVENT\s*$/i.test(line)) {
      if (ev && ev.start && !ev.start.allDay) {
        if (!ev.uid) ev.uid = `ev${events.length}`;
        events.push(ev);
      }
      ev = null;
      if (events.length >= MAX_EVENTS) break;
      continue;
    }
    if (!ev) continue;
    const p = splitLine(line);
    if (!p) continue;
    switch (p.name) {
      case 'UID': ev.uid = p.value.trim(); break;
      case 'SUMMARY': ev.summary = unescapeText(p.value); break;
      case 'LOCATION': ev.location = unescapeText(p.value); break;
      case 'STATUS': ev.status = p.value.trim().toUpperCase(); break;
      case 'DTSTART': ev.start = parseDateValue(p.value, p.params); break;
      case 'DTEND': ev.end = parseDateValue(p.value, p.params); break;
      case 'DURATION': ev.duration = parseDuration(p.value); break;
      case 'RRULE': ev.rrule = parseRrule(p.value); break;
      case 'RECURRENCE-ID': ev.recurrenceId = parseDateValue(p.value, p.params); break;
      case 'EXDATE': p.value.split(',').forEach((v) => { const d = parseDateValue(v, p.params); if (d) ev.exdates.push(d); }); break;
      case 'RDATE': p.value.split(',').forEach((v) => { const d = parseDateValue(v.split('/')[0], p.params); if (d) ev.rdates.push(d); }); break;
      default: break;
    }
  }
  return events;
}

// ---------- Calcul des cours ----------
const dayNum = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
const dow = (dn) => (dn + 4) % 7; // 0 = dimanche
const fromDayNum = (dn) => { const t = new Date(dn * DAY_MS); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const BYDAY = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function dateMs(dt, tz) {
  if (dt.utc) return Date.UTC(dt.y, dt.m - 1, dt.d, dt.h, dt.mi, dt.s);
  return wallToMs(dt.y, dt.m, dt.d, dt.h, dt.mi, dt.s, resolveTz(dt.tzid, tz));
}

function monthLength(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

function parseByDay(list) {
  return String(list || '').split(',').map((x) => {
    const m = /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/i.exec(x.trim());
    return m ? { n: m[1] ? parseInt(m[1], 10) : 0, dow: BYDAY[m[2].toUpperCase()] } : null;
  }).filter(Boolean);
}

// Cette date (numéro de jour) fait-elle partie de la répétition ?
function matchesRule(dn, rule, startDn, tools) {
  const freq = (rule.FREQ || '').toUpperCase();
  const interval = Math.max(1, parseInt(rule.INTERVAL, 10) || 1);
  const t = fromDayNum(dn);
  const s = fromDayNum(startDn);
  const byday = parseByDay(rule.BYDAY);
  const bymonth = rule.BYMONTH ? rule.BYMONTH.split(',').map(Number) : null;
  const bymonthday = rule.BYMONTHDAY ? rule.BYMONTHDAY.split(',').map(Number) : null;
  if (bymonth && !bymonth.includes(t.m)) return false;

  if (freq === 'DAILY') {
    if ((dn - startDn) % interval !== 0) return false;
    if (byday.length && !byday.some((b) => b.dow === dow(dn))) return false;
    return true;
  }
  if (freq === 'WEEKLY') {
    const w = rule.WKST ? (BYDAY[rule.WKST.toUpperCase()] ?? 1) : 1;
    const sow = (x) => x - ((dow(x) - w + 7) % 7);
    if (((sow(dn) - sow(startDn)) / 7) % interval !== 0) return false;
    const days = byday.length ? byday.map((b) => b.dow) : [dow(startDn)];
    return days.includes(dow(dn));
  }
  if (freq === 'MONTHLY') {
    const months = (t.y - s.y) * 12 + (t.m - s.m);
    if (months < 0 || months % interval !== 0) return false;
    if (bymonthday) {
      const len = monthLength(t.y, t.m);
      return bymonthday.some((x) => (x > 0 ? x : len + 1 + x) === t.d);
    }
    if (byday.length) {
      const len = monthLength(t.y, t.m);
      return byday.some((b) => {
        if (b.dow !== dow(dn)) return false;
        if (!b.n) return true;
        const nth = Math.floor((t.d - 1) / 7) + 1;
        const fromEnd = Math.floor((len - t.d) / 7) + 1;
        return b.n > 0 ? nth === b.n : fromEnd === -b.n;
      });
    }
    return t.d === s.d;
  }
  if (freq === 'YEARLY') {
    if ((t.y - s.y) % interval !== 0) return false;
    if (!bymonth && t.m !== s.m) return false;
    if (byday.length) return byday.some((b) => b.dow === dow(dn));
    return t.d === s.d;
  }
  return false;
}

function untilMs(rule, tz, startWall) {
  if (!rule.UNTIL) return Infinity;
  const dt = parseDateValue(rule.UNTIL, {});
  if (!dt) return Infinity;
  if (dt.allDay) return wallToMs(dt.y, dt.m, dt.d, 23, 59, 59, tz);
  if (dt.utc) return Date.UTC(dt.y, dt.m - 1, dt.d, dt.h, dt.mi, dt.s);
  return wallToMs(dt.y, dt.m, dt.d, dt.h, dt.mi, dt.s, tz);
}

/**
 * @param {object[]} events résultat de parseIcs
 * @param {number} fromMs début de la période (inclus)
 * @param {number} toMs   fin de la période (exclu)
 * @param {string} [tz]   fuseau de l'ordinateur (par défaut : celui du système)
 * @returns {{uid:string, summary:string, location:string, startMs:number, endMs:number, key:string}[]} triés par début
 */
function expand(events, fromMs, toMs, tz) {
  const zone = tz || localTz();
  const out = [];
  const overrides = new Map(); // uid → Set des débuts d'instances remplacées
  events.filter((e) => e.recurrenceId).forEach((e) => {
    if (!overrides.has(e.uid)) overrides.set(e.uid, new Set());
    overrides.get(e.uid).add(dateMs(e.recurrenceId, resolveTz(e.start.tzid, zone)));
  });

  const push = (e, startMs, endMs) => {
    if (e.status === 'CANCELLED') return;
    if (endMs <= fromMs || startMs >= toMs) return;
    out.push({ uid: e.uid, summary: e.summary, location: e.location, startMs, endMs, key: `${e.uid}@${startMs}` });
  };

  for (const e of events) {
    const evTz = e.start.utc ? 'UTC' : resolveTz(e.start.tzid, zone);
    const startMs = dateMs(e.start, zone);
    let durMs;
    if (e.end && !e.end.allDay) durMs = dateMs(e.end, zone) - startMs;
    else if (typeof e.duration === 'number') durMs = e.duration;
    else durMs = 0;
    if (!(durMs > 0)) durMs = 50 * 60 * 1000; // sans fin : une heure de cours « classique » (50 min)

    if (e.recurrenceId) { push(e, startMs, startMs + durMs); continue; }

    if (!e.rrule) {
      push(e, startMs, startMs + durMs);
    } else {
      const skip = overrides.get(e.uid) || new Set();
      const exMs = new Set();
      const exDays = new Set();
      e.exdates.forEach((x) => { if (x.allDay) exDays.add(dayNum(x.y, x.m, x.d)); else exMs.add(dateMs(x, zone)); });
      const startDn = dayNum(e.start.y, e.start.m, e.start.d);
      const until = untilMs(e.rrule, evTz, e.start);
      const count = parseInt(e.rrule.COUNT, 10) || Infinity;
      const horizonDn = Math.floor(toMs / DAY_MS) + 2;
      const instances = [];
      let n = 0;
      for (let dn = startDn; dn <= horizonDn; dn++) {
        if (dn !== startDn && !matchesRule(dn, e.rrule, startDn, null)) continue;
        const dd = fromDayNum(dn);
        const ms = e.start.utc
          ? Date.UTC(dd.y, dd.m - 1, dd.d, e.start.h, e.start.mi, e.start.s)
          : wallToMs(dd.y, dd.m, dd.d, e.start.h, e.start.mi, e.start.s, evTz);
        if (ms > until) break;
        n++;
        if (n > count) break;
        instances.push([dn, ms]);
      }
      e.rdates.forEach((r) => { if (!r.allDay) instances.push([dayNum(r.y, r.m, r.d), dateMs(r, zone)]); });
      instances.forEach(([dn, ms]) => {
        if (skip.has(ms) || exMs.has(ms) || exDays.has(dn)) return;
        push(e, ms, ms + durMs);
      });
    }
  }
  out.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  // Doublons éventuels (même cours listé deux fois)
  return out.filter((o, i) => i === 0 || o.key !== out[i - 1].key);
}

// Nom de la matière : le titre de l'événement, nettoyé (même règle que dans Mes Devoirs : 30 caractères max)
function subjectOf(summary) {
  return String(summary || '').replace(/\s+/g, ' ').trim().slice(0, 30);
}

module.exports = { parseIcs, expand, subjectOf, resolveTz, wallToMs, tzOffset, localTz };
