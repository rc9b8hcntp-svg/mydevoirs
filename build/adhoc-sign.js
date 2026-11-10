// Signature « ad hoc » (sans compte Apple Developer) de l'app macOS avant de créer le .dmg.
// Sans elle, les Mac Apple Silicon (M1/M2/M3…) disent que l'app est « endommagée ».
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  console.log(`  • signature ad hoc : ${appPath}`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
};
