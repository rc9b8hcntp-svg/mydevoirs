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

function normalizeTag(input) {
  const t = String(input || '').trim();
  return /^[\w.+-]{1,64}$/.test(t) ? t : '';
}

async function getJson(url, fetchFn) {
  let res;
  try {
    res = await fetchFn(url, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Mes-Devoirs' },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    return { err: { status: 'network' } };
  }
  if (res.status === 404) return { err: { status: 'no-release' } };
  if (!res.ok) return { err: { status: 'error', code: res.status } };
  try { return { json: await res.json() }; } catch (e) { return { err: { status: 'error' } }; }
}

// Choisit le .msi qui correspond à l'architecture (x64, ia32, arm64) parmi les fichiers d'une release
function pickAsset(assets, arch) {
  if (!Array.isArray(assets)) return null;
  const re = new RegExp(`-${String(arch).replace(/[^\w]/g, '')}\\.msi$`, 'i');
  const a = assets.find((x) => x && typeof x.name === 'string' && re.test(x.name) && typeof x.browser_download_url === 'string');
  if (!a) return null;
  const m = /^sha256:([0-9a-f]{64})$/i.exec(String(a.digest || ''));
  return { name: a.name, url: a.browser_download_url, size: Number(a.size) || 0, sha256: m ? m[1].toLowerCase() : null };
}

// tagInput vide = dernière version ; sinon la version publiée avec ce tag
async function checkForUpdate(repoInput, currentVersion, tagInput = '', fetchFn = fetch, arch = process.arch) {
  const repo = normalizeRepo(repoInput);
  if (!repo) return { status: 'no-repo' };
  const tag = normalizeTag(tagInput);

  const url = tag
    ? `https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`
    : `https://api.github.com/repos/${repo}/releases/latest`;
  const { json, err } = await getJson(url, fetchFn);
  if (err) return err.status === 'no-release' ? { status: 'no-release', repo } : err;

  const latest = String(json.tag_name || json.name || '').trim().replace(/^v/i, '');
  if (!latest) return { status: 'no-release', repo };

  let status = 'up-to-date';
  if (isNewer(latest, currentVersion)) status = 'available';
  else if (tag && isNewer(currentVersion, latest)) status = 'older';

  return {
    status,
    latest,
    tag: json.tag_name || tag,
    url: typeof json.html_url === 'string' ? json.html_url : `https://github.com/${repo}/releases/latest`,
    repo,
    asset: pickAsset(json.assets, arch),
    notes: typeof json.body === 'string' ? json.body.slice(0, 20000) : '',
  };
}

// Liste des versions (tags) publiées, de la plus récente à la plus ancienne
async function listReleases(repoInput, fetchFn = fetch) {
  const repo = normalizeRepo(repoInput);
  if (!repo) return { status: 'no-repo' };
  const { json, err } = await getJson(`https://api.github.com/repos/${repo}/releases?per_page=30`, fetchFn);
  if (err) return err;
  const releases = (Array.isArray(json) ? json : [])
    .filter((r) => r && !r.draft && typeof r.tag_name === 'string' && normalizeTag(r.tag_name))
    .map((r) => ({ tag: r.tag_name, prerelease: !!r.prerelease }));
  return { status: 'ok', releases };
}

module.exports = { normalizeRepo, normalizeTag, isNewer, pickAsset, checkForUpdate, listReleases };
