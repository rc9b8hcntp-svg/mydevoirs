'use strict';

// Lien avec Mes Devoirs, installé à côté de Cartable OS (dans le sous-dossier « Mes Devoirs » du dossier d'installation).
// Cartable OS lit les devoirs dans le fichier de Mes Devoirs (lecture seule : il ne le modifie jamais).
// Sans Electron pour les parties testables.

const fs = require('fs');
const path = require('path');

const FOLDER = 'Mes Devoirs';
const EXE = 'Mes Devoirs.exe';
const AUMID = 'fr.maxence.mesdevoirs'; // le même que dans Mes Devoirs (pour que ses notifications s'affichent)

function exePath(execPath) {
  return path.join(path.dirname(execPath), FOLDER, EXE);
}

function dataFile(appDataDir) {
  return path.join(appDataDir, FOLDER, 'devoirs.json');
}

const MAX_BYTES = 20 * 1024 * 1024;

// Devoirs enregistrés par Mes Devoirs → liste simplifiée. Renvoie null si le fichier n'existe pas encore.
function readHomework(file) {
  let raw;
  try {
    if (fs.statSync(file).size > MAX_BYTES) return [];
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return e && e.code === 'ENOENT' ? null : [];
  }
  const list = raw && Array.isArray(raw.homework) ? raw.homework : [];
  return list.filter((h) => h && typeof h === 'object' && typeof h.title === 'string').map((h) => ({
    id: String(h.id || ''),
    title: h.title.slice(0, 200),
    subject: typeof h.subject === 'string' ? h.subject.slice(0, 60) : '',
    date: typeof h.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(h.date) ? h.date : '',
    done: !!h.done,
    priority: Number(h.priority) || 1,
  }));
}

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function dayDiff(dateStr, now) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

const byDate = (a, b) => a.date.localeCompare(b.date) || b.priority - a.priority || a.title.localeCompare(b.title, 'fr');
const MAX_LIST = 30;

/**
 * Devoirs à faire, classés pour l'écran d'accueil.
 * @param {object[]|null} homework résultat de readHomework
 * @param {Date} now
 * @param {string} currentSubject matière du cours en cours ('' si aucun)
 */
function summarize(homework, now, currentSubject) {
  if (homework === null) return { found: false, late: [], today: [], tomorrow: [], soon: [], forCourse: [], total: 0 };
  const todo = homework.filter((h) => !h.done);
  const withDiff = todo.map((h) => ({ h, n: h.date ? dayDiff(h.date, now) : null }));
  const pick = (fn) => withDiff.filter(fn).map((x) => x.h).sort(byDate).slice(0, MAX_LIST);
  const cur = norm(currentSubject);
  return {
    found: true,
    late: pick((x) => x.n !== null && x.n < 0),
    today: pick((x) => x.n === 0),
    tomorrow: pick((x) => x.n === 1),
    soon: pick((x) => x.n !== null && x.n >= 2 && x.n <= 7),
    forCourse: cur ? todo.filter((h) => norm(h.subject) === cur).sort((a, b) => (a.date || '9').localeCompare(b.date || '9')).slice(0, 10) : [],
    total: todo.length,
  };
}

module.exports = { FOLDER, EXE, AUMID, exePath, dataFile, readHomework, summarize };
