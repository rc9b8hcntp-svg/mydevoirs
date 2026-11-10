'use strict';

// Import d'un emploi du temps depuis un fichier texte : CSV / TXT, ICS (agenda) ou JSON.
// Résultat : une liste { name, days } où days = jours de cours (1 = lundi … 7 = dimanche).
// Aucune dépendance à Electron (testable seul).

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const DAY_WORDS = {
  lundi: 1, lun: 1, lu: 1, mardi: 2, mar: 2, ma: 2, mercredi: 3, mer: 3, me: 3, jeudi: 4, jeu: 4, je: 4,
  vendredi: 5, ven: 5, ve: 5, samedi: 6, sam: 6, sa: 6, dimanche: 7, dim: 7, di: 7,
  monday: 1, mon: 1, tuesday: 2, tue: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6, sunday: 7, sun: 7,
};
const ICS_DAYS = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };
const MARKS = /^(x|✓|✔|oui|o|yes|y|1|•|\*|■|●)$/i;

const clean = (name) => String(name || '').replace(/\s+/g, ' ').trim().slice(0, 30);

function addRow(map, name, days) {
  name = clean(name);
  if (!name || !days.length) return;
  const k = norm(name);
  if (!map.has(k)) map.set(k, { name, days: new Set() });
  days.forEach((d) => map.get(k).days.add(d));
}

function finish(map) {
  return [...map.values()].map((r) => ({ name: r.name, days: [...r.days].sort() })).slice(0, 100);
}

function daysFromText(text) {
  const out = new Set();
  String(text || '').split(/[\s,;/+|&]+|\bet\b/).forEach((w) => {
    const k = norm(w).replace(/\.$/, '');
    if (DAY_WORDS[k]) out.add(DAY_WORDS[k]);
  });
  return [...out];
}

function splitLine(line, sep) {
  const cells = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === sep && !q) { cells.push(cur); cur = ''; } else cur += c;
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

// Deux formes acceptées :
//  - liste :   « Maths;lundi, mercredi »          (une matière par ligne)
//  - grille :  « Matière;Lun;Mar;Mer;Jeu;Ven » puis « Maths;x;;x;; » (une croix par jour de cours)
function parseTable(text) {
  const map = new Map();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return map;
  const sep = [';', '\t', ','].map((s) => ({ s, n: lines[0].split(s).length })).sort((a, b) => b.n - a.n)[0].s;
  const rows = lines.map((l) => splitLine(l, sep));

  // En-tête de grille : au moins 2 cellules qui sont des noms de jours
  const head = rows[0].map((c) => DAY_WORDS[norm(c).replace(/\.$/, '')] || 0);
  const isGrid = head.filter(Boolean).length >= 2;
  if (isGrid) {
    rows.slice(1).forEach((cells) => {
      const days = [];
      cells.forEach((c, i) => { if (i > 0 && head[i] && c && MARKS.test(c.trim())) days.push(head[i]); });
      addRow(map, cells[0], days);
    });
    return map;
  }
  rows.forEach((cells, i) => {
    if (cells.length < 2) {
      // « Maths : lundi, mercredi »
      const m = /^(.+?)\s*[:\-–]\s*(.+)$/.exec(cells[0] || '');
      if (m) addRow(map, m[1], daysFromText(m[2]));
      return;
    }
    const days = daysFromText(cells.slice(1).join(' '));
    if (i === 0 && !days.length) return; // ligne de titres
    addRow(map, cells[0], days);
  });
  return map;
}

function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
}

// Agenda (.ics) : un cours = un événement (SUMMARY) ; son jour vient de DTSTART ou de RRULE:BYDAY
function parseIcs(text) {
  const map = new Map();
  let ev = null;
  unfoldIcs(text).forEach((line) => {
    if (/^BEGIN:VEVENT/i.test(line)) { ev = { summary: '', dow: 0, byday: [] }; return; }
    if (/^END:VEVENT/i.test(line)) {
      if (ev) {
        const days = ev.byday.length ? ev.byday : (ev.dow ? [ev.dow] : []);
        addRow(map, ev.summary, days);
      }
      ev = null;
      return;
    }
    if (!ev) return;
    let m;
    if ((m = /^SUMMARY[^:]*:(.*)$/i.exec(line))) ev.summary = m[1].replace(/\\,/g, ',').replace(/\\;/g, ';');
    else if ((m = /^DTSTART[^:]*:(\d{4})(\d{2})(\d{2})/i.exec(line))) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      ev.dow = (d.getDay() + 6) % 7 + 1;
    } else if ((m = /^RRULE:.*BYDAY=([A-Z0-9,+-]+)/i.exec(line))) {
      m[1].split(',').forEach((x) => { const d = ICS_DAYS[x.replace(/[^A-Z]/gi, '').slice(-2).toUpperCase()]; if (d) ev.byday.push(d); });
    }
  });
  return map;
}

function parseJson(text) {
  const map = new Map();
  let raw;
  try { raw = JSON.parse(text); } catch (e) { return map; }
  const list = Array.isArray(raw) ? raw : (Array.isArray(raw && raw.subjects) ? raw.subjects : (raw && raw.settings && Array.isArray(raw.settings.subjects) ? raw.settings.subjects : []));
  list.forEach((s) => {
    if (!s || typeof s !== 'object') return;
    const days = (Array.isArray(s.days) ? s.days : []).map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7);
    addRow(map, s.name, days);
  });
  return map;
}

/**
 * @param {string} text contenu du fichier
 * @param {string} ext   extension (sans point), pour deviner le format
 * @returns {{name: string, days: number[]}[]}
 */
function parseSchedule(text, ext) {
  const t = String(text || '').replace(/^﻿/, '');
  const e = String(ext || '').toLowerCase();
  if (e === 'ics' || /^BEGIN:VCALENDAR/i.test(t.trim())) return finish(parseIcs(t));
  if (e === 'json' || /^[[{]/.test(t.trim())) return finish(parseJson(t));
  return finish(parseTable(t));
}

module.exports = { parseSchedule };
