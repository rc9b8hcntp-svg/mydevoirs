'use strict';

// Construit Mes Devoirs (dossier mes-devoirs/) sous forme de programme « déballé » (Mes Devoirs.exe + ses fichiers),
// puis le copie dans build/mes-devoirs-unpacked. L'installeur de Cartable OS l'embarque (voir « extraFiles » dans
// package.json) : un seul build, un seul .msi, qui installe les deux logiciels.
//
// Utilisation : node scripts/prepare-devoirs.js [--arch x64|ia32|arm64]   (par défaut : x64)

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const devDir = path.join(root, 'mes-devoirs');
const outDir = path.join(root, 'build', 'mes-devoirs-unpacked');

const i = process.argv.indexOf('--arch');
const arch = i > -1 ? process.argv[i + 1] : (process.env.CARTABLE_ARCH || 'x64');
if (!['x64', 'ia32', 'arm64'].includes(arch)) {
  console.error(`Architecture inconnue : « ${arch} » (x64, ia32 ou arm64).`);
  process.exit(1);
}

function run(cmd) {
  console.log(`\n> ${cmd}`);
  const r = spawnSync(cmd, { cwd: devDir, stdio: 'inherit', shell: true, env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' } });
  if (r.status !== 0) {
    console.error(`\nÉchec : ${cmd}`);
    process.exit(r.status || 1);
  }
}

// Dépôt GitHub des mises à jour : celui qui construit l'installeur (dans GitHub Actions, GITHUB_REPOSITORY = « pseudo/depot »).
// Écrit pour Cartable OS (build/update-repo.json) ET pour Mes Devoirs (mes-devoirs/update-repo.json) : les deux
// cherchent leurs mises à jour dans les Releases du même dépôt, où ils trouvent le .msi qui met tout à jour.
const repo = (process.env.GITHUB_REPOSITORY || '').trim();
if (/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  const body = `${JSON.stringify({ repo }, null, 2)}\n`;
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  fs.writeFileSync(path.join(root, 'build', 'update-repo.json'), body);
  fs.writeFileSync(path.join(devDir, 'update-repo.json'), body);
  console.log(`Dépôt des mises à jour : ${repo}`);
} else {
  console.log('Dépôt des mises à jour : inconnu (build local, pas GitHub Actions). Les mises à jour automatiques seront désactivées.');
}

// Mes Devoirs a le même numéro de version que Cartable OS (c'est ce que compare sa mise à jour)
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const devPkgFile = path.join(devDir, 'package.json');
const devPkg = JSON.parse(fs.readFileSync(devPkgFile, 'utf8'));
if (devPkg.version !== version) {
  devPkg.version = version;
  fs.writeFileSync(devPkgFile, `${JSON.stringify(devPkg, null, 2)}\n`);
  console.log(`Version de Mes Devoirs : ${version}`);
}

if (!fs.existsSync(path.join(devDir, 'node_modules'))) run('npm install --no-audit --no-fund');

fs.rmSync(path.join(devDir, 'dist'), { recursive: true, force: true });
run(`npx electron-builder --win dir --${arch} --publish never`);

const dist = path.join(devDir, 'dist');
const found = fs.readdirSync(dist).filter((n) => /unpacked$/.test(n) && fs.existsSync(path.join(dist, n, 'Mes Devoirs.exe')));
if (found.length !== 1) {
  console.error(`Impossible de trouver « Mes Devoirs.exe » dans ${dist} (trouvé : ${found.join(', ') || 'rien'}).`);
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(path.join(dist, found[0]), outDir, { recursive: true });
console.log(`\nMes Devoirs (${arch}) prêt : ${path.relative(root, outDir)}`);
