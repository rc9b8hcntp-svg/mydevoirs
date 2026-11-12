'use strict';

// Dépôt GitHub où chercher les mises à jour. Il n'est pas écrit en dur : le build (scripts/prepare-devoirs.js) le note
// dans « update-repo.json » à partir du dépôt qui construit l'installeur (GITHUB_REPOSITORY). Les mises à jour
// viennent donc toujours du dépôt qui a publié le .msi installé, quel que soit son nom.

const fs = require('fs');

const REPO_RE = /^[\w.-]+\/[\w.-]+$/;

// Lit { "repo": "pseudo/depot" } ; renvoie `fallback` si le fichier est absent ou invalide.
function readRepo(file, fallback = '') {
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (j && typeof j.repo === 'string' && REPO_RE.test(j.repo)) return j.repo;
  } catch (e) { /* absent : build local */ }
  return fallback;
}

module.exports = { readRepo, REPO_RE };
