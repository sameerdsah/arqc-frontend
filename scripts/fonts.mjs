// Bundles IBM Plex Sans / Mono with the app (no font CDN, so the strict CSP and offline use stay).
// Run once in the emv-crypto-ui folder, after:  npm install @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
//   node scripts/fonts.mjs
// Adds the Latin font files to the "styles" of the build in angular.json (safe to run again).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const FONTS = [
  'node_modules/@fontsource/ibm-plex-sans/latin-400.css',
  'node_modules/@fontsource/ibm-plex-sans/latin-500.css',
  'node_modules/@fontsource/ibm-plex-sans/latin-600.css',
  'node_modules/@fontsource/ibm-plex-mono/latin-400.css',
  'node_modules/@fontsource/ibm-plex-mono/latin-500.css'
];

const missing = FONTS.filter(f => !existsSync(f));
if (missing.length) {
  console.error('Not installed yet. Run first:  npm install @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono');
  process.exit(1);
}

const config = JSON.parse(readFileSync('angular.json', 'utf8'));
let changed = 0;
for (const project of Object.values(config.projects)) {
  const options = project.architect?.build?.options;
  if (!options) continue;
  const styles = options.styles ?? [];
  const rest = styles.filter(s => !FONTS.includes(typeof s === 'string' ? s : s.input));
  options.styles = [...FONTS, ...rest];          // fonts first, then src/styles.css
  changed++;
}
writeFileSync('angular.json', JSON.stringify(config, null, 2) + '\n');
console.log(`angular.json updated (${changed} project). Fonts: IBM Plex Sans 400/500/600, IBM Plex Mono 400/500.`);
