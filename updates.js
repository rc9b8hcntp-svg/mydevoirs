'use strict';

// Mise à jour de Cartable OS : cherche la dernière Release GitHub, télécharge le .msi qui correspond à l'ordinateur, l'ouvre,
// puis ferme Cartable OS pour laisser l'installation se faire. Ce .msi contient aussi Mes Devoirs : une seule mise à jour
// pour les deux logiciels. Sans Electron (tout arrive par `deps`) : testable seul.

const path = require('path');

// Seuls les installeurs publiés dans les Releases GitHub sont acceptés
const ASSET_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\/[^/\s]+\/[\w.+-]+\.msi$/i;

/**
 * deps : repo(), version(), tempDir(), shell, quit(), checkForUpdate, listReleases, downloadFile
 */
function createUpdater(deps) {
  let lastAsset = null;   // installeur trouvé par la dernière recherche (l'interface ne choisit jamais quoi télécharger)
  let downloading = false;

  async function check(tag) {
    const r = await deps.checkForUpdate(deps.repo(), deps.version(), tag);
    lastAsset = r && r.asset ? r.asset : null;
    if (r && r.asset) r.asset = { name: r.asset.name, size: r.asset.size };
    return r;
  }

  async function download(onProgress) {
    if (!lastAsset || !ASSET_URL.test(lastAsset.url)) return { ok: false, reason: 'no-asset' };
    if (downloading) return { ok: false, reason: 'busy' };
    downloading = true;
    try {
      const dir = path.join(deps.tempDir(), 'CartableOS-update');
      const dest = path.join(dir, path.basename(lastAsset.name));
      let lastSent = 0;
      const r = await deps.downloadFile({
        url: lastAsset.url,
        dest,
        expectedSize: lastAsset.size,
        sha256: lastAsset.sha256,
        onProgress: (p) => {
          const t = Date.now();
          if (t - lastSent < 100 && p.received !== p.total) return;
          lastSent = t;
          if (onProgress) onProgress(p);
        },
      });
      if (!r.ok) return r;
      const openError = await deps.shell.openPath(dest); // ouvre l'installateur Windows (.msi)
      if (openError) return { ok: false, reason: 'launch' };
      deps.quit(); // Cartable OS se ferme pour que l'installateur puisse remplacer ses fichiers
      return { ok: true };
    } finally {
      downloading = false;
    }
  }

  const list = () => deps.listReleases(deps.repo());

  // On n'ouvre que des pages GitHub
  function openPage(url) {
    if (typeof url === 'string' && /^https:\/\/github\.com\//.test(url)) { deps.shell.openExternal(url); return true; }
    return false;
  }

  return { check, download, list, openPage };
}

module.exports = { createUpdater, ASSET_URL };
