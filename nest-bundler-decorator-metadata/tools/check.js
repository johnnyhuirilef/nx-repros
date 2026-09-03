const { spawn } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');

const BUNDLES = [
  ['webpack', join(root, 'dist', 'apps', 'api', 'main.js')],
  ['esbuild', join(root, 'dist', 'esbuild', 'main.js')],
  ['rspack', join(root, 'dist', 'rspack', 'main.js')],
];

// The app boots under every bundler. Only a request shows the difference,
// so each bundle is started and asked for its one route.
function ask(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], { stdio: 'ignore' });
    setTimeout(async () => {
      let result;
      try {
        const response = await fetch('http://localhost:3000/api');
        result = `${response.status} ${(await response.text()).trim()}`;
      } catch (error) {
        result = `no answer (${error.message})`;
      }
      child.kill('SIGKILL');
      resolve(result);
    }, 4000);
  });
}

function countMetadata(file) {
  const bundle = readFileSync(file, 'utf8');
  // Only the app's own classes matter. Nest ships precompiled metadata of
  // its own, so the count is taken on the controller that needs it.
  const controller = bundle.slice(bundle.indexOf('AppController'));
  // Match the emitted call, not the words, so a comment cannot inflate the
  // count. Each compiler names its helper differently: tslib for tsc, and
  // _ts_metadata for SWC.
  const emitted = /(?:_ts_metadata|__metadata)\(\s*['"]design:paramtypes/g;
  return (controller.match(emitted) ?? []).length;
}

(async () => {
  const answers = [];

  for (const [label, file] of BUNDLES) {
    if (!existsSync(file)) {
      console.log(`${label.padEnd(9)} not built - run \`npm run build\` first`);
      process.exit(1);
    }
    const answer = await ask(file);
    const metadata = countMetadata(file);
    answers.push([label, answer]);
    console.log(
      `${label.padEnd(9)} GET /api -> ${answer.padEnd(46)} design:paramtypes after AppController: ${metadata}`
    );
  }

  console.log('');
  const failing = answers.filter(([, answer]) => !answer.startsWith('200'));
  const passing = answers.filter(([, answer]) => answer.startsWith('200'));

  if (failing.length === 1 && failing[0][0] === 'esbuild') {
    console.log(
      'CONFIRMED: esbuild builds and boots, then answers 500, because it emits'
    );
    console.log(
      '           no design:paramtypes and Nest injects undefined.'
    );
    console.log(
      `           ${passing.map(([label]) => label).join(' and ')} answer 200.`
    );
    process.exit(0);
  }

  console.log('UNEXPECTED: read the table above.');
  process.exit(1);
})();
