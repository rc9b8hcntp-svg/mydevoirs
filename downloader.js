'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STALL_MS = 30000; // pas une seule donnée reçue pendant 30 s = on abandonne

// Télécharge `url` vers `dest` (via un fichier .part), vérifie la taille et l'empreinte SHA-256 si on les connaît.
// Retourne { ok: true } ou { ok: false, reason: 'network' | 'size' | 'hash' | 'disk' }.
async function downloadFile({ url, dest, expectedSize, sha256, onProgress, fetchFn = fetch, stallMs = STALL_MS }) {
  const part = dest + '.part';
  const controller = new AbortController();
  let timer = null;
  const arm = () => { clearTimeout(timer); timer = setTimeout(() => controller.abort(), stallMs); };
  let out = null;

  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.rmSync(part, { force: true });
    arm();

    let res;
    try {
      res = await fetchFn(url, { headers: { 'User-Agent': 'Mes-Devoirs', Accept: 'application/octet-stream' }, redirect: 'follow', signal: controller.signal });
    } catch (e) {
      return { ok: false, reason: 'network' };
    }
    if (!res.ok || !res.body) return { ok: false, reason: 'network' };

    const total = Number(res.headers.get('content-length')) || expectedSize || 0;
    const hash = crypto.createHash('sha256');
    let received = 0;
    out = fs.createWriteStream(part);
    const writeError = new Promise((_, rej) => out.on('error', rej));
    writeError.catch(() => {}); // évite une alerte si l'erreur arrive après coup

    const reader = res.body.getReader();
    try {
      for (;;) {
        const { done, value } = await Promise.race([reader.read(), writeError]);
        if (done) break;
        arm();
        hash.update(value);
        received += value.length;
        if (!out.write(value)) await Promise.race([new Promise((r) => out.once('drain', r)), writeError]);
        if (onProgress) onProgress({ received, total });
      }
      await Promise.race([new Promise((r) => out.end(r)), writeError]);
    } catch (e) {
      try { controller.abort(); } catch (_) { /* ignoré */ }
      return { ok: false, reason: e && e.code && e.syscall ? 'disk' : 'network' };
    }

    if (expectedSize && received !== expectedSize) return { ok: false, reason: 'size' };
    if (sha256 && hash.digest('hex').toLowerCase() !== String(sha256).toLowerCase()) return { ok: false, reason: 'hash' };

    fs.renameSync(part, dest);
    return { ok: true, size: received };
  } catch (e) {
    return { ok: false, reason: 'disk' };
  } finally {
    clearTimeout(timer);
    if (out) out.destroy();
    fs.rmSync(part, { force: true });
  }
}

module.exports = { downloadFile };
