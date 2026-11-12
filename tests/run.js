'use strict';
// Tests de la logique de Cartable OS (sans Electron) : node tests/run.js
process.env.TZ = 'Europe/Paris'; // heure d'un collège français ; doit être fixé avant tout calcul de date

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseIcs, expand, subjectOf, resolveTz } = require('../ics');
const { computeStatus } = require('../scheduler');
const apps = require('../apps');
const dv = require('../devoirs-link');

let passed = 0;
const queue = [];
const test = (name, fn) => queue.push({ name, fn });
const group = (title) => queue.push({ title });
const paris = (y, m, d, h = 0, mi = 0) => new Date(Date.UTC(y, m - 1, d, h, mi)).getTime(); // (UTC)
const iso = (ms) => new Date(ms).toISOString().slice(0, 16);

const ICS = (body) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}\r\nEND:VCALENDAR\r\n`;

group('ics.js');

test('cours hebdomadaire avec fuseau Europe/Paris (hiver : UTC+1)', () => {
  const ev = parseIcs(ICS(`BEGIN:VEVENT
UID:maths@x
SUMMARY:Maths
DTSTART;TZID=Europe/Paris:20261109T080000
DTEND;TZID=Europe/Paris:20261109T090000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
END:VEVENT`));
  assert.strictEqual(ev.length, 1);
  const occ = expand(ev, paris(2026, 11, 9), paris(2026, 11, 16), 'Europe/Paris');
  assert.deepStrictEqual(occ.map((o) => iso(o.startMs)), ['2026-11-09T07:00', '2026-11-11T07:00']); // 08:00 Paris = 07:00 UTC
  assert.strictEqual(occ[0].endMs - occ[0].startMs, 3600000);
});

test('le changement d\'heure (fin octobre) ne décale pas les cours', () => {
  const ev = parseIcs(ICS(`BEGIN:VEVENT
UID:fr@x
SUMMARY:Français
DTSTART;TZID=Europe/Paris:20261019T080000
DTEND;TZID=Europe/Paris:20261019T090000
RRULE:FREQ=WEEKLY;BYDAY=MO
END:VEVENT`));
  const occ = expand(ev, paris(2026, 10, 19), paris(2026, 11, 3), 'Europe/Paris');
  // 19/10 : heure d'été (UTC+2) → 06:00 UTC ; 26/10 : heure d'hiver depuis la nuit (UTC+1) → 07:00 UTC
  assert.deepStrictEqual(occ.map((o) => iso(o.startMs)), ['2026-10-19T06:00', '2026-10-26T07:00', '2026-11-02T07:00']);
});

test('heure UTC (Z), durée DURATION, pas de fin', () => {
  const ev = parseIcs(ICS(`BEGIN:VEVENT
UID:a
SUMMARY:SVT
DTSTART:20261112T090000Z
DURATION:PT1H30M
END:VEVENT
BEGIN:VEVENT
UID:b
SUMMARY:EPS
DTSTART:20261112T130000Z
END:VEVENT`));
  const occ = expand(ev, paris(2026, 11, 12), paris(2026, 11, 13), 'Europe/Paris');
  assert.strictEqual(occ[0].endMs - occ[0].startMs, 90 * 60000);
  assert.strictEqual(occ[1].endMs - occ[1].startMs, 50 * 60000);
});

test('EXDATE, COUNT, UNTIL', () => {
  const ev = parseIcs(ICS(`BEGIN:VEVENT
UID:c
SUMMARY:Anglais
DTSTART;TZID=Europe/Paris:20261109T100000
DTEND;TZID=Europe/Paris:20261109T110000
RRULE:FREQ=WEEKLY;COUNT=4
EXDATE;TZID=Europe/Paris:20261116T100000
END:VEVENT
BEGIN:VEVENT
UID:d
SUMMARY:Histoire
DTSTART;TZID=Europe/Paris:20261109T110000
DTEND;TZID=Europe/Paris:20261109T120000
RRULE:FREQ=WEEKLY;UNTIL=20261116T235959Z
END:VEVENT`));
  const occ = expand(ev, paris(2026, 11, 1), paris(2026, 12, 31), 'Europe/Paris');
  const ang = occ.filter((o) => o.summary === 'Anglais').map((o) => iso(o.startMs));
  assert.deepStrictEqual(ang, ['2026-11-09T09:00', '2026-11-23T09:00', '2026-11-30T09:00']);
  assert.strictEqual(occ.filter((o) => o.summary === 'Histoire').length, 2);
});

test('cours déplacé (RECURRENCE-ID) et cours annulé', () => {
  const ev = parseIcs(ICS(`BEGIN:VEVENT
UID:m
SUMMARY:Maths
DTSTART;TZID=Europe/Paris:20261109T080000
DTEND;TZID=Europe/Paris:20261109T090000
RRULE:FREQ=WEEKLY
END:VEVENT
BEGIN:VEVENT
UID:m
RECURRENCE-ID;TZID=Europe/Paris:20261116T080000
SUMMARY:Maths
DTSTART;TZID=Europe/Paris:20261116T140000
DTEND;TZID=Europe/Paris:20261116T150000
END:VEVENT
BEGIN:VEVENT
UID:m
RECURRENCE-ID;TZID=Europe/Paris:20261123T080000
SUMMARY:Maths
STATUS:CANCELLED
DTSTART;TZID=Europe/Paris:20261123T080000
DTEND;TZID=Europe/Paris:20261123T090000
END:VEVENT`));
  const occ = expand(ev, paris(2026, 11, 9), paris(2026, 11, 30), 'Europe/Paris');
  assert.deepStrictEqual(occ.map((o) => iso(o.startMs)), ['2026-11-09T07:00', '2026-11-16T13:00']);
});

test('événements « toute la journée » ignorés, lignes repliées, accents et virgules échappées', () => {
  const ev = parseIcs(ICS(`BEGIN:VEVENT
UID:v
SUMMARY:Vacances
DTSTART;VALUE=DATE:20261221
DTEND;VALUE=DATE:20270104
END:VEVENT
BEGIN:VEVENT
UID:w
SUMMARY:Physique-Chimie\\, TP
 (salle 12)
DTSTART;TZID=Europe/Paris:20261112T150000
DTEND;TZID=Europe/Paris:20261112T160000
LOCATION:Salle 12
END:VEVENT`));
  assert.strictEqual(ev.length, 1);
  assert.strictEqual(ev[0].summary, 'Physique-Chimie, TP(salle 12)');
  assert.strictEqual(subjectOf(ev[0].summary).length <= 30, true);
});

test('noms de fuseaux Windows et inconnus', () => {
  assert.strictEqual(resolveTz('Romance Standard Time', 'UTC'), 'Europe/Paris');
  assert.strictEqual(resolveTz('/mozilla.org/20050126_1/Europe/Paris', 'UTC'), 'Europe/Paris');
  assert.strictEqual(resolveTz('Nimporte/Quoi', 'Europe/Paris'), 'Europe/Paris');
});

test('un agenda de collège complet sur une semaine', () => {
  const lines = [];
  [['Maths', '08:00', 'MO,WE'], ['Français', '09:00', 'MO,TU,TH'], ['Anglais', '10:15', 'TU,FR']].forEach(([n, t, d], i) => {
    const [h, m] = t.split(':');
    lines.push(`BEGIN:VEVENT\nUID:e${i}\nSUMMARY:${n}\nDTSTART;TZID=Europe/Paris:20260907T${h}${m}00\nDTEND;TZID=Europe/Paris:20260907T${+h + 1}${m}00\nRRULE:FREQ=WEEKLY;BYDAY=${d}\nEND:VEVENT`);
  });
  const occ = expand(parseIcs(ICS(lines.join('\n'))), paris(2026, 11, 9), paris(2026, 11, 16), 'Europe/Paris');
  assert.strictEqual(occ.length, 7); // Maths 2 + Français 3 + Anglais 2
});

group('scheduler.js');

test('session : du premier au dernier cours ; cours en cours ; prochain cours', () => {
  const occ = [
    { uid: 'a', summary: 'Maths', startMs: paris(2026, 11, 12, 7), endMs: paris(2026, 11, 12, 8), key: 'a@1' },
    { uid: 'b', summary: 'Français', startMs: paris(2026, 11, 12, 9), endMs: paris(2026, 11, 12, 10), key: 'b@1' },
    { uid: 'c', summary: 'Anglais', startMs: paris(2026, 11, 13, 7), endMs: paris(2026, 11, 13, 8), key: 'c@1' },
  ];
  let s = computeStatus(occ, paris(2026, 11, 12, 6, 59)); // 07:59 Paris
  assert.strictEqual(s.inSession, false);
  assert.strictEqual(s.next.uid, 'a');
  s = computeStatus(occ, paris(2026, 11, 12, 7, 30));
  assert.strictEqual(s.inSession, true);
  assert.strictEqual(s.current.uid, 'a');
  s = computeStatus(occ, paris(2026, 11, 12, 8, 30)); // pause entre deux cours : la session continue
  assert.strictEqual(s.inSession, true);
  assert.strictEqual(s.current, null);
  assert.strictEqual(s.next.uid, 'b');
  s = computeStatus(occ, paris(2026, 11, 12, 9, 0) + 59 * 60000 + 59000);
  assert.strictEqual(s.inSession, true);
  s = computeStatus(occ, paris(2026, 11, 12, 10, 0)); // fin du dernier cours : la session est finie
  assert.strictEqual(s.inSession, false);
  assert.strictEqual(s.next.uid, 'c');
  assert.deepStrictEqual(s.session && iso(s.session.endMs), '2026-11-12T10:00');
});

test('aucun cours : pas de session', () => {
  const s = computeStatus([], Date.now());
  assert.strictEqual(s.inSession, false);
  assert.strictEqual(s.session, null);
  assert.strictEqual(s.next, null);
});

group('apps.js');

test('classification des cibles', () => {
  assert.strictEqual(apps.classifyTarget('winword'), 'command');
  assert.strictEqual(apps.classifyTarget('C:\\Program Files\\App\\app.exe'), 'path');
  assert.strictEqual(apps.classifyTarget('\\\\serveur\\partage\\app.exe'), 'path');
  assert.strictEqual(apps.classifyTarget('https://ent.example.fr'), 'url');
  assert.strictEqual(apps.classifyTarget('ms-word:'), 'url');
  assert.strictEqual(apps.classifyTarget('winword & calc'), 'invalid');
  assert.strictEqual(apps.classifyTarget('javascript:alert(1)'), 'invalid');
  assert.strictEqual(apps.classifyTarget('file:///C:/x'), 'invalid');
  assert.strictEqual(apps.classifyTarget(''), 'invalid');
});

test('liste d\'applications : les 4 de base toujours présentes, personnalisées validées', () => {
  const list = apps.normalizeApps([
    { id: 'word', target: 'C:\\Office\\WINWORD.EXE' },
    { id: 'excel', target: 'calc & del *' },
    { id: 'c_abcd1234', name: '  Mon ENT ', target: 'https://ent.example.fr', builtin: false },
    { id: 'c_bad', name: 'x', target: 'https://x.fr' },
    { id: 'c_zzzz9999', name: '', target: 'https://x.fr' },
  ]);
  assert.deepStrictEqual(list.slice(0, 4).map((a) => a.id), ['word', 'excel', 'powerpoint', 'explorer']);
  assert.strictEqual(list[0].target, 'C:\\Office\\WINWORD.EXE');
  assert.strictEqual(list[1].target, 'excel');
  assert.strictEqual(list.length, 5);
  assert.strictEqual(list[4].name, 'Mon ENT');
});

test('lancement : url, chemin, commande Windows, explorateur', async () => {
  const calls = [];
  const spawn = (cmd, args) => {
    calls.push([cmd, args]);
    const h = {};
    return { on: (e, f) => { h[e] = f; if (e === 'exit') setTimeout(() => f(0), 1); }, unref() {} };
  };
  const shell = { openExternal: async (u) => calls.push(['ext', u]), openPath: async (p) => (p.includes('absent') ? 'erreur' : '') };
  const deps = { shell, spawn, platform: 'win32', rootFolder: 'C:\\Docs\\Cartable OS' };
  assert.deepStrictEqual(await apps.launchApp({ kind: 'custom', target: 'https://ent.example.fr' }, deps), { ok: true });
  assert.deepStrictEqual(await apps.launchApp({ kind: 'custom', target: 'C:\\x\\absent.exe' }, deps), { ok: false, reason: 'not-found' });
  assert.deepStrictEqual(await apps.launchApp({ kind: 'word', target: 'winword' }, deps), { ok: true });
  assert.deepStrictEqual(calls.find((c) => c[0] === 'cmd.exe'), ['cmd.exe', ['/d', '/c', 'start', '', 'winword']]);
  await apps.launchApp({ kind: 'explorer', target: 'explorer.exe' }, deps);
  assert.deepStrictEqual(calls.find((c) => c[0] === 'explorer.exe'), ['explorer.exe', ['C:\\Docs\\Cartable OS']]);
  assert.deepStrictEqual(await apps.launchApp({ kind: 'custom', target: 'a & b' }, deps), { ok: false, reason: 'invalid' });
});

test('lancement : logiciel introuvable (start renvoie une erreur)', async () => {
  const spawn = () => ({ on: (e, f) => { if (e === 'exit') setTimeout(() => f(1), 1); }, unref() {} });
  const r = await apps.launchApp({ kind: 'word', target: 'winword' }, { shell: {}, spawn, platform: 'win32', rootFolder: '' });
  assert.deepStrictEqual(r, { ok: false, reason: 'not-found' });
});

group('devoirs-link.js');

test('lecture des devoirs de Mes Devoirs et classement', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartable-test-'));
  const file = path.join(dir, 'devoirs.json');
  const now = new Date(2026, 10, 12, 10, 0);
  const d = (n) => { const x = new Date(2026, 10, 12 + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  fs.writeFileSync(file, JSON.stringify({
    homework: [
      { id: '1', title: 'Ex 5 p 42', subject: 'Maths', date: d(-2), done: false, priority: 2 },
      { id: '2', title: 'Lire le chapitre', subject: 'Français', date: d(0), done: false },
      { id: '3', title: 'Exposé', subject: 'maths', date: d(1), done: false },
      { id: '4', title: 'Fait', subject: 'Maths', date: d(0), done: true },
      { id: '5', title: 'Plus tard', subject: 'SVT', date: d(20), done: false },
      { id: '6', title: 'Cette semaine', subject: 'SVT', date: d(4), done: false },
      { id: '7', title: 'Sans date', subject: 'Maths', done: false },
      { nope: true },
    ],
  }));
  const list = dv.readHomework(file);
  assert.strictEqual(list.length, 7);
  const s = dv.summarize(list, now, 'Maths');
  assert.deepStrictEqual(s.late.map((h) => h.id), ['1']);
  assert.deepStrictEqual(s.today.map((h) => h.id), ['2']);
  assert.deepStrictEqual(s.tomorrow.map((h) => h.id), ['3']);
  assert.deepStrictEqual(s.soon.map((h) => h.id), ['6']);
  assert.deepStrictEqual(s.forCourse.map((h) => h.id), ['1', '3', '7']);
  assert.strictEqual(s.total, 6);
  assert.strictEqual(dv.readHomework(path.join(dir, 'absent.json')), null);
  assert.strictEqual(dv.summarize(null, now, '').found, false);
  fs.writeFileSync(file, '{ pas du json');
  assert.deepStrictEqual(dv.readHomework(file), []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('chemins de Mes Devoirs', () => {
  assert.strictEqual(dv.exePath(path.join('C:', 'Cartable OS', 'Cartable OS.exe')), path.join('C:', 'Cartable OS', 'Mes Devoirs', 'Mes Devoirs.exe'));
  assert.strictEqual(dv.dataFile(path.join('C:', 'AppData')), path.join('C:', 'AppData', 'Mes Devoirs', 'devoirs.json'));
});

group('devoirs-embed.js (Mes Devoirs intégré)');

// Charge un preload avec un faux Electron et renvoie ce qu'il expose à la page
function exposedApi(preloadFile) {
  const Module = require('module');
  const exposed = {};
  const fake = { contextBridge: { exposeInMainWorld: (name, api) => { exposed[name] = api; } }, ipcRenderer: { invoke: async () => undefined, on() {} } };
  const orig = Module._load;
  Module._load = function (request, ...rest) { return request === 'electron' ? fake : orig.call(this, request, ...rest); };
  try { delete require.cache[require.resolve(preloadFile)]; require(preloadFile); } finally { Module._load = orig; }
  return exposed;
}

test('l\'interface intégrée a exactement le même devoirsAPI que Mes Devoirs (sinon elle planterait)', () => {
  const real = exposedApi('../mes-devoirs/preload.js').devoirsAPI;
  const embedded = exposedApi('../devoirs-embed-preload.js').devoirsAPI;
  assert.deepStrictEqual(Object.keys(embedded).sort(), Object.keys(real).sort());
});

test('les actions du logiciel à part répondent « indisponible » sans planter', async () => {
  const api = exposedApi('../devoirs-embed-preload.js').devoirsAPI;
  assert.strictEqual(await api.toggleWidget(true), false);
  assert.strictEqual(await api.widgetState(), false);
  assert.deepStrictEqual(await api.testNotification(), { ok: false });
});

test('chaque canal « dv: » appelé par le preload est bien servi par le programme principal', () => {
  const embed = require('../devoirs-embed');
  const handled = new Set();
  const calls = new Set();
  const Module = require('module');
  const fake = { contextBridge: { exposeInMainWorld: (_n, api) => { Object.values(api).forEach((f) => f()); } }, ipcRenderer: { invoke: (ch) => { calls.add(ch); return Promise.resolve(); }, on() {} } };
  const orig = Module._load;
  Module._load = function (request, ...rest) { return request === 'electron' ? fake : orig.call(this, request, ...rest); };
  try { delete require.cache[require.resolve('../devoirs-embed-preload.js')]; require('../devoirs-embed-preload.js'); } finally { Module._load = orig; }
  embed.createEmbed({
    ipcMain: { handle: (ch) => handled.add(ch) }, dialog: {}, shell: {}, app: {},
    dataFile: () => '', isEmbedSender: () => true, parentWindow: () => undefined, sendToView() {}, onSaved() {},
  }).register();
  assert.ok(calls.size >= 15, `canaux appelés : ${calls.size}`);
  calls.forEach((ch) => assert.ok(handled.has(ch), `canal sans réponse : ${ch}`));
});

test('nettoyage des données reçues de l\'interface', () => {
  const embed = require('../devoirs-embed');
  assert.deepStrictEqual(embed.cleanData(null), { homework: [], trash: [], archive: [], settings: {} });
  assert.deepStrictEqual(embed.cleanData({ homework: 'x', trash: [1], settings: [] }), { homework: [], trash: [1], archive: [], settings: [] });
  const d = embed.cleanData({ homework: [{ id: 'a' }], settings: { subjects: [{ name: 'Maths' }], templates: [] } });
  assert.deepStrictEqual(embed.changePayload(d).subjects, [{ name: 'Maths' }]);
  assert.strictEqual(embed.changePayload(embed.cleanData({})).subjects, null);
});

test('la vue intégrée masque ce qui appartient au logiciel à part', () => {
  const { HIDE_CSS } = require('../devoirs-embed');
  ['#widgetBtn', '#w-open', '#n-bg', '#n-startup', '#n-test'].forEach((sel) => assert.ok(HIDE_CSS.includes(sel), sel));
  assert.ok(!HIDE_CSS.includes('data-tab="update"'), 'l\'onglet Mise à jour reste visible : il met à jour les deux logiciels');
  // ces éléments existent vraiment dans l'interface de Mes Devoirs (sinon le CSS ne masquerait rien)
  const html = fs.readFileSync(path.join(__dirname, '..', 'mes-devoirs', 'src', 'index.html'), 'utf8');
  ['id="widgetBtn"', 'id="w-open"', 'id="n-bg"', 'id="n-startup"', 'id="n-test"'].forEach((frag) => assert.ok(html.includes(frag), frag));
});

test('le .msi embarque tous les fichiers dont la vue intégrée a besoin', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const files = pkg.build.files;
  ['devoirs-embed.js', 'devoirs-embed-preload.js', 'updates.js', 'update-config.js', 'build/update-repo.json', 'mes-devoirs/src/**/*', 'mes-devoirs/backup.js', 'mes-devoirs/sync.js', 'mes-devoirs/schedule-import.js', 'mes-devoirs/updater.js', 'mes-devoirs/downloader.js'].forEach((f) => assert.ok(files.includes(f), `absent de build.files : ${f}`));
  // tout ce que main.js charge, y compris ce que ces fichiers chargent à leur tour, est dans la liste (sinon l'appli installée planterait au lancement)
  const root = path.join(__dirname, '..');
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    [...src.matchAll(/require\('(\.[^']+)'\)/g)].forEach((m) => {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1]));
      const file = fs.existsSync(path.join(root, `${target}.js`)) ? `${target}.js` : target;
      const covered = files.some((f) => f === file || (f.endsWith('/**/*') && file.startsWith(f.slice(0, -4))));
      assert.ok(covered, `non embarqué : ${file} (chargé par ${rel})`);
      if (fs.existsSync(path.join(root, file))) walk(file);
    });
  };
  walk('main.js');
  assert.ok(seen.has('devoirs-embed.js') && seen.has('updates.js'));
  assert.ok(seen.has('mes-devoirs/notifier.js'), 'la chaîne de dépendances est bien suivie jusqu\'à notifier.js');
});

group('mises à jour (updates.js, update-config.js)');

test('dépôt des mises à jour : lu dans update-repo.json, sinon vide (pas de dépôt deviné)', () => {
  const { readRepo } = require('../update-config');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartable-upd-'));
  const f = path.join(dir, 'update-repo.json');
  assert.strictEqual(readRepo(f), '');
  assert.strictEqual(readRepo(f, 'a/b'), 'a/b');
  fs.writeFileSync(f, JSON.stringify({ repo: 'moi/cartable-os' }));
  assert.strictEqual(readRepo(f), 'moi/cartable-os');
  fs.writeFileSync(f, JSON.stringify({ repo: 'pas un depot ; rm -rf' }));
  assert.strictEqual(readRepo(f), '');
  fs.writeFileSync(f, '{ cassé');
  assert.strictEqual(readRepo(f), '');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mise à jour : recherche, téléchargement du .msi, ouverture puis fermeture de Cartable OS', async () => {
  const { createUpdater } = require('../updates');
  const { checkForUpdate } = require('../mes-devoirs/updater');
  const asset = { name: 'CartableOS-1.0.9-x64.msi', browser_download_url: 'https://github.com/moi/cartable-os/releases/download/v1.0.9/CartableOS-1.0.9-x64.msi', size: 1234, digest: `sha256:${'a'.repeat(64)}` };
  const fetchFn = async (url) => {
    assert.ok(url.startsWith('https://api.github.com/repos/moi/cartable-os/releases/latest'), url);
    return { ok: true, status: 200, json: async () => ({ tag_name: 'v1.0.9', html_url: 'https://github.com/moi/cartable-os/releases/tag/v1.0.9', body: 'Mes Devoirs intégré', assets: [asset] }) };
  };
  const log = { opened: [], quit: 0, downloaded: [], external: [] };
  const up = createUpdater({
    repo: () => 'moi/cartable-os', version: () => '1.0.3', tempDir: () => os.tmpdir(),
    shell: { openPath: async (p) => { log.opened.push(p); return ''; }, openExternal: (u) => log.external.push(u) },
    quit: () => { log.quit++; },
    checkForUpdate: (repo, v, tag) => checkForUpdate(repo, v, tag, fetchFn, 'x64'),
    listReleases: async () => ({ status: 'ok', releases: [] }),
    downloadFile: async (o) => { log.downloaded.push(o); o.onProgress({ received: 1234, total: 1234 }); return { ok: true }; },
  });
  assert.deepStrictEqual(await up.download(), { ok: false, reason: 'no-asset' }, 'rien à télécharger avant d\'avoir cherché');
  const r = await up.check('');
  assert.strictEqual(r.status, 'available');
  assert.deepStrictEqual(r.asset, { name: 'CartableOS-1.0.9-x64.msi', size: 1234 }, 'l\'interface ne voit ni l\'adresse ni l\'empreinte');
  const seen = [];
  assert.deepStrictEqual(await up.download((p) => seen.push(p)), { ok: true });
  assert.strictEqual(log.downloaded[0].url, asset.browser_download_url);
  assert.strictEqual(log.downloaded[0].sha256, 'a'.repeat(64));
  assert.ok(/CartableOS-update/.test(log.downloaded[0].dest) && /CartableOS-1\.0\.9-x64\.msi$/.test(log.opened[0]));
  assert.strictEqual(seen.length, 1);
  assert.strictEqual(log.quit, 1, 'Cartable OS se ferme pour laisser l\'installateur faire son travail');
  assert.strictEqual(up.openPage('https://github.com/moi/cartable-os/releases'), true);
  assert.strictEqual(up.openPage('https://evil.example/x'), false);
  assert.strictEqual(up.openPage('file:///C:/x'), false);
});

test('mise à jour : adresse de téléchargement hors GitHub refusée, échec du téléchargement sans fermer l\'appli', async () => {
  const { createUpdater } = require('../updates');
  const mk = (asset, dl) => {
    const q = { quit: 0 };
    const up = createUpdater({
      repo: () => 'moi/x', version: () => '1.0.0', tempDir: () => os.tmpdir(), shell: { openPath: async () => '', openExternal() {} }, quit: () => { q.quit++; },
      checkForUpdate: async () => ({ status: 'available', latest: '2.0.0', asset }), listReleases: async () => ({}), downloadFile: dl,
    });
    return { up, q };
  };
  let a = mk({ name: 'x-x64.msi', url: 'https://evil.example/x-x64.msi', size: 1 }, async () => ({ ok: true }));
  await a.up.check('');
  assert.deepStrictEqual(await a.up.download(), { ok: false, reason: 'no-asset' });
  a = mk({ name: 'CartableOS-2.0.0-x64.msi', url: 'https://github.com/moi/x/releases/download/v2.0.0/CartableOS-2.0.0-x64.msi', size: 1 }, async () => ({ ok: false, reason: 'network' }));
  await a.up.check('');
  assert.deepStrictEqual(await a.up.download(), { ok: false, reason: 'network' });
  assert.strictEqual(a.q.quit, 0);
  assert.deepStrictEqual(await a.up.download(), { ok: false, reason: 'network' }, 'on peut réessayer après un échec');
});

test('sans dépôt connu (build local), la recherche répond « no-repo » sans appeler Internet', async () => {
  const { checkForUpdate } = require('../mes-devoirs/updater');
  const r = await checkForUpdate('', '1.0.0', '', async () => { throw new Error('ne doit pas être appelé'); });
  assert.deepStrictEqual(r, { status: 'no-repo' });
});

(async () => {
  for (const t of queue) {
    if (t.title) { console.log(t.title); continue; }
    try { await t.fn(); passed++; console.log(`  ok  ${t.name}`); } catch (e) { console.error(`  ÉCHEC  ${t.name}\n${e.stack}`); process.exitCode = 1; }
  }
  console.log(process.exitCode ? '\nDes tests ont échoué.' : `\n${passed} tests réussis`);
})();
