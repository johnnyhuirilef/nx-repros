const { execFileSync } = require('node:child_process');
const { existsSync, rmSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const app = join(root, 'apps', 'api');

const NEST_OPTIONAL = [
  '@nestjs/microservices',
  '@nestjs/websockets',
  'class-transformer',
  'class-validator',
  'cache-manager',
];

function run(label, command, args) {
  process.stdout.write(`${label.padEnd(9)} `);
  try {
    execFileSync(command, args, { cwd: root, stdio: 'pipe' });
    console.log('built');
  } catch (error) {
    console.log('FAILED');
    console.log(String(error.stdout ?? error.message).slice(-600));
    process.exitCode = 1;
  }
}

rmSync(join(root, 'dist'), { recursive: true, force: true });

// The webpack config is what `nx g @nx/nest:application` writes today.
run('webpack', 'npx', ['nx', 'build', 'api', '--skip-nx-cache']);

// Nest ships optional peers it requires lazily; mark them external so the
// bundle is about decorator metadata and nothing else.
run('esbuild', 'npx', [
  'esbuild',
  join(app, 'src', 'main.ts'),
  '--bundle',
  '--platform=node',
  '--target=node20',
  `--tsconfig=${join(app, 'tsconfig.app.json')}`,
  `--outfile=${join(root, 'dist', 'esbuild', 'main.js')}`,
  ...NEST_OPTIONAL.map((pkg) => `--external:${pkg}`),
]);

run('rspack', 'npx', ['nx', 'build-rspack', 'api', '--skip-nx-cache']);

for (const [label, file] of [
  ['webpack', join(root, 'dist', 'apps', 'api', 'main.js')],
  ['esbuild', join(root, 'dist', 'esbuild', 'main.js')],
  ['rspack', join(root, 'dist', 'rspack', 'main.js')],
]) {
  if (!existsSync(file)) {
    console.log(`${label.padEnd(9)} no output at ${file}`);
  }
}
