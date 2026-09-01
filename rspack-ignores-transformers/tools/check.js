const { existsSync } = require('fs');
const { execFileSync } = require('child_process');
const { join, resolve } = require('path');

const root = resolve(__dirname, '..');

// Run each bundle instead of grepping it. Source comments also carry the
// marker text, so only the printed value is proof.
function runBundle(bundler) {
  const bundle = join(root, 'dist', bundler, 'main.js');
  if (!existsSync(bundle)) return null;
  return execFileSync(process.execPath, [bundle], { encoding: 'utf8' }).trim();
}

const webpack = runBundle('webpack');
const rspack = runBundle('rspack');

console.log(`webpack bundle prints   ${webpack ?? 'not built'}`);
console.log(`rspack bundle prints    ${rspack ?? 'not built'}`);
console.log('');

if (webpack === null || rspack === null) {
  console.log('INCONCLUSIVE: build both targets first with `npm run build`');
  process.exit(1);
}

if (webpack === 'TRANSFORMER_RAN' && rspack === 'TRANSFORMER_DID_NOT_RUN') {
  console.log('IGNORED: rspack accepted the transformers option and never ran it');
  console.log('         the build reported success and printed no warning');
  process.exit(0);
}

if (webpack === 'TRANSFORMER_RAN' && rspack === 'TRANSFORMER_RAN') {
  console.log('FIXED: both bundlers ran the transformer');
  process.exit(0);
}

console.log('UNEXPECTED: webpack did not run the transformer either');
process.exit(1);
