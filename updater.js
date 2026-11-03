'use strict';

// Vérifie s'il existe une version plus récente publiée dans les « Releases » GitHub.

// Accepte « pseudo/depot » ou une adresse https://github.com/pseudo/depot
function normalizeRepo(input) {
  const s = String(input || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^\/+/, '');
  const m = s.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

function parseVersion(v) {
  return String(v).trim().replace(/^v/i, '').split(/[.+-]/).slice(0, 3).map((n) => parseInt(n, 10) || 0);
}

// true si a est plus récente que b
function isNewer(a, b) {
  const x = parseVersion(a);
  const y = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    const p = x[i] || 0;
    const q = y[i] || 0;
    if (p !== q) return p > q;
  }
  return false;
}

async function checkForUpdate(repoInput, currentVersion, fetchFn = fetch) {
  const repo = normalizeRepo(repoInput);
  if (!repo) return { status: 'no-repo' };

  let res;
  try {
    res = await fetchFn(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Mes-Devoirs' },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    return { status: 'network' };
  }

  if (res.status === 404) return { status: 'no-release', repo };
  if (!res.ok) return { status: 'error', code: res.status };

  let json;
  try { json = await res.json(); } catch (e) { return { status: 'error' }; }
  const latest = String(json.tag_name || json.name || '').trim().replace(/^v/i, '');
  if (!latest) return { status: 'no-release', repo };

  return {
    status: isNewer(latest, currentVersion) ? 'available' : 'up-to-date',
    latest,
    url: typeof json.html_url === 'string' ? json.html_url : `https://github.com/${repo}/releases/latest`,
    repo,
  };
}

module.exports = { normalizeRepo, isNewer, checkForUpdate };
