'use strict';

// Synchronisation entre ordinateurs par un dossier partagé (OneDrive, Google Drive, clé USB…).
// Chaque ordinateur écrit un fichier « MesDevoirs-synchro.json » dans ce dossier ; les modifications
// des deux côtés sont fusionnées, devoir par devoir (la modification la plus récente gagne).
// Aucune dépendance à Electron, pour pouvoir tester ce module seul.

const backup = require('./backup');

const FILE_NAME = 'MesDevoirs-synchro.json';
const SYNC_APP = 'mes-devoirs-sync';
const TRASH_DAYS = 30; // la corbeille se vide toute seule après ce délai, sur tous les ordinateurs
const key = (s) => String(s || '').trim().toLowerCase();

// Un devoir peut se trouver à trois endroits : la liste, la corbeille (deletedAt) ou l'archive (archivedAt).
// Pour chaque identifiant, la version la plus récente l'emporte, où qu'elle soit.
function stamp(item, place) {
  if (place === 'trash') return Math.max(Number(item.deletedAt) || 0, Number(item.updatedAt) || 0);
  if (place === 'archive') return Math.max(Number(item.archivedAt) || 0, Number(item.updatedAt) || 0);
  return Number(item.updatedAt) || 0;
}

function mergeHomework(local, remote, now) {
  const best = new Map(); // id -> { item, place, t }
  const order = [];
  const consider = (list, place) => {
    (Array.isArray(list) ? list : []).forEach((item) => {
      if (!item || !item.id) return;
      const t = stamp(item, place);
      const cur = best.get(item.id);
      if (!cur) { best.set(item.id, { item, place, t }); order.push(item.id); } else if (t > cur.t) best.set(item.id, { item, place, t });
    });
  };
  // En cas d'égalité, la version locale (considérée en premier) est gardée.
  consider(local.homework, 'live'); consider(local.trash, 'trash'); consider(local.archive, 'archive');
  consider(remote.homework, 'live'); consider(remote.trash, 'trash'); consider(remote.archive, 'archive');
  const out = { homework: [], trash: [], archive: [] };
  const limit = now - TRASH_DAYS * 86400000;
  order.forEach((id) => {
    const { item, place } = best.get(id);
    if (place === 'trash' && (Number(item.deletedAt) || 0) < limit) return; // trop ancien : retiré partout
    if (place === 'trash') out.trash.push(item); else if (place === 'archive') out.archive.push(item); else out.homework.push(item);
  });
  return out;
}

function mergeSubjects(local, remote) {
  const out = (Array.isArray(local) ? local : []).slice();
  const names = new Set(out.map((s) => key(s.name)));
  (Array.isArray(remote) ? remote : []).forEach((s) => {
    if (!s || !s.name || names.has(key(s.name))) return;
    names.add(key(s.name));
    out.push(s);
  });
  return out;
}

function mergeTemplates(local, remote) {
  const out = (Array.isArray(local) ? local : []).slice();
  const ids = new Set(out.map((t) => t.id));
  (Array.isArray(remote) ? remote : []).forEach((t) => {
    if (!t || !t.id || ids.has(t.id)) return;
    ids.add(t.id);
    out.push(t);
  });
  return out;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// local, remote : { homework, trash, archive, subjects, templates }
function mergeData(local, remote, now = Date.now()) {
  const hw = mergeHomework(local, remote, now);
  const merged = {
    homework: hw.homework,
    trash: hw.trash,
    archive: hw.archive,
    subjects: mergeSubjects(local.subjects, remote.subjects),
    templates: mergeTemplates(local.templates, remote.templates),
  };
  const norm = (d) => ({
    homework: [...(d.homework || [])].sort((a, b) => (a.id < b.id ? -1 : 1)),
    trash: [...(d.trash || [])].sort((a, b) => (a.id < b.id ? -1 : 1)),
    archive: [...(d.archive || [])].sort((a, b) => (a.id < b.id ? -1 : 1)),
    subjects: (d.subjects || []).map((s) => key(s.name)).sort(),
    templates: (d.templates || []).map((t) => t.id).sort(),
  });
  return {
    merged,
    changedLocal: !same(norm(merged), norm(local)),
    changedRemote: !same(norm(merged), norm(remote)),
  };
}

// Contenu du fichier partagé (propre) à partir de l'état local
function buildSyncFile(data, device, now = Date.now()) {
  return {
    app: SYNC_APP,
    format: 1,
    savedAt: now,
    device: String(device || '').slice(0, 60),
    homework: backup.sanitizeHomework(data.homework),
    trash: backup.sanitizeHomework(data.trash),
    archive: backup.sanitizeHomework(data.archive),
    subjects: backup.sanitizeSubjects(data.subjects),
    templates: backup.sanitizeTemplates(data.templates),
  };
}

// Lit le texte du fichier partagé. Il vient de l'extérieur : tout est nettoyé.
function parseSyncFile(text) {
  let raw;
  try { raw = JSON.parse(text); } catch (e) { return { ok: false, reason: 'json' }; }
  if (!raw || typeof raw !== 'object' || raw.app !== SYNC_APP) return { ok: false, reason: 'format' };
  if (!Number.isInteger(raw.format) || raw.format > 1) return { ok: false, reason: 'too-new' };
  return {
    ok: true,
    savedAt: Number(raw.savedAt) || 0,
    device: typeof raw.device === 'string' ? raw.device : '',
    data: {
      homework: backup.sanitizeHomework(raw.homework),
      trash: backup.sanitizeHomework(raw.trash),
      archive: backup.sanitizeHomework(raw.archive),
      subjects: backup.sanitizeSubjects(raw.subjects),
      templates: backup.sanitizeTemplates(raw.templates),
    },
  };
}

module.exports = { FILE_NAME, SYNC_APP, TRASH_DAYS, mergeData, buildSyncFile, parseSyncFile };
