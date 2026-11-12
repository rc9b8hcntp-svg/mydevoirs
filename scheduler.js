'use strict';

// Règles de Cartable OS, calculées à partir des cours (voir ics.js). Sans Electron : testable seul.
//
//  - Session : du début du premier cours de la journée à la fin du dernier. Cartable OS reste ouvert pendant ce temps.
//  - Cours en cours : au début d'un cours, le dossier de sa matière s'ouvre automatiquement.

const DAY_MS = 86400000;

const startOfDay = (ms) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };

// Période pendant laquelle on calcule les cours : hier → dans 8 jours (pour « le prochain cours »)
function watchWindow(nowMs) {
  const day = startOfDay(nowMs);
  return { fromMs: day - DAY_MS, toMs: day + 8 * DAY_MS };
}

/**
 * @param {{uid:string, summary:string, location:string, startMs:number, endMs:number, key:string}[]} occurrences triés par début
 * @param {number} nowMs
 */
function computeStatus(occurrences, nowMs) {
  const day = startOfDay(nowMs);
  const tomorrow = day + DAY_MS;
  const today = occurrences.filter((o) => o.startMs >= day && o.startMs < tomorrow);

  let session = null;
  if (today.length) {
    session = { startMs: Math.min(...today.map((o) => o.startMs)), endMs: Math.max(...today.map((o) => o.endMs)) };
  }
  const inSession = !!session && nowMs >= session.startMs && nowMs < session.endMs;

  // S'il y a deux cours en même temps, on prend celui qui a commencé en dernier
  const running = occurrences.filter((o) => o.startMs <= nowMs && nowMs < o.endMs);
  const current = running.length ? running[running.length - 1] : null;
  const next = occurrences.find((o) => o.startMs > nowMs) || null;

  return { today, session, inSession, current, next };
}

module.exports = { computeStatus, watchWindow, startOfDay };
