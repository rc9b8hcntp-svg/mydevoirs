'use strict';

// Applications de l'écran d'accueil : Word, Excel, PowerPoint, Explorateur de fichiers,
// Mes Devoirs, et celles que l'utilisateur ajoute lui-même. Sans Electron : testable seul.

const path = require('path');

const DEFAULT_APPS = [
  { id: 'word', kind: 'word', name: 'Word', target: 'winword', builtin: true },
  { id: 'excel', kind: 'excel', name: 'Excel', target: 'excel', builtin: true },
  { id: 'powerpoint', kind: 'powerpoint', name: 'PowerPoint', target: 'powerpnt', builtin: true },
  { id: 'explorer', kind: 'explorer', name: 'Explorateur de fichiers', target: 'explorer.exe', builtin: true },
];
const MAX_CUSTOM = 40;

const isUrl = (t) => /^(https?:\/\/|ms-[a-z-]+:)/i.test(t);
const isAbsPath = (t) => /^[a-zA-Z]:[\\/]/.test(t) || /^\\\\[^\\]/.test(t) || path.posix.isAbsolute(t);
const isCommand = (t) => /^[A-Za-z0-9_.-]{1,64}$/.test(t);

// Que représente ce que l'utilisateur a tapé ?
function classifyTarget(target) {
  const t = String(target || '').trim();
  if (!t || t.length > 1000) return 'invalid';
  if (isUrl(t)) return 'url';
  if (isAbsPath(t)) return 'path';
  if (isCommand(t)) return 'command';
  return 'invalid';
}

const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 40);
const cleanTarget = (s) => String(s || '').trim().replace(/^"(.*)"$/, '$1').slice(0, 1000);

// Liste enregistrée → liste valide : les 4 applications de base sont toujours là, dans l'ordre ; Mes Devoirs est ajouté
// par l'appelant (son chemin dépend de l'installation).
function normalizeApps(saved) {
  const list = Array.isArray(saved) ? saved : [];
  const byId = new Map(list.filter((a) => a && typeof a.id === 'string').map((a) => [a.id, a]));
  const out = DEFAULT_APPS.map((d) => {
    const s = byId.get(d.id);
    const target = s && classifyTarget(cleanTarget(s.target)) !== 'invalid' ? cleanTarget(s.target) : d.target;
    return { ...d, target };
  });
  list.filter((a) => a && a.builtin !== true && typeof a.id === 'string' && /^c_[a-z0-9]{4,20}$/.test(a.id)).slice(0, MAX_CUSTOM).forEach((a) => {
    const name = cleanName(a.name);
    const target = cleanTarget(a.target);
    if (name && classifyTarget(target) !== 'invalid') out.push({ id: a.id, kind: 'custom', name, target, builtin: false });
  });
  return out;
}

const newId = () => `c_${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`;

/**
 * Lance une application. `deps` : { shell, spawn, platform, rootFolder }.
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function launchApp(app, deps) {
  const { shell, spawn, platform, rootFolder } = deps;
  const target = cleanTarget(app.target);
  const type = classifyTarget(target);

  if (type === 'url') {
    try { await shell.openExternal(target); return { ok: true }; } catch (e) { return { ok: false, reason: 'launch' }; }
  }
  if (type === 'path') {
    const err = await shell.openPath(target);
    return err ? { ok: false, reason: 'not-found' } : { ok: true };
  }
  if (type === 'command') {
    // L'explorateur s'ouvre directement sur le dossier de Cartable OS
    if (app.kind === 'explorer' && /^explorer(\.exe)?$/i.test(target)) {
      return spawnDetached(spawn, 'explorer.exe', rootFolder ? [rootFolder] : []);
    }
    if (platform === 'win32') {
      // « start » trouve les programmes enregistrés dans Windows (winword, excel, powerpnt…). Le nom ne contient que
      // des lettres, chiffres, point, tiret : rien à échapper.
      return spawnDetached(spawn, 'cmd.exe', ['/d', '/c', 'start', '', target], true);
    }
    return spawnDetached(spawn, target, []);
  }
  return { ok: false, reason: 'invalid' };
}

function spawnDetached(spawn, cmd, args, waitExit) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done) { done = true; resolve(r); } };
    let child;
    try {
      child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true });
    } catch (e) { finish({ ok: false, reason: 'not-found' }); return; }
    child.on('error', () => finish({ ok: false, reason: 'not-found' }));
    if (waitExit) {
      child.on('exit', (code) => finish(code === 0 || code === null ? { ok: true } : { ok: false, reason: 'not-found' }));
      setTimeout(() => finish({ ok: true }), 4000);
    } else {
      setTimeout(() => finish({ ok: true }), 300);
    }
    if (child.unref) child.unref();
  });
}

module.exports = { DEFAULT_APPS, classifyTarget, normalizeApps, newId, launchApp, cleanName, cleanTarget };
