const { writeFileSync } = require('fs');
const { join, resolve } = require('path');

// Nx resolves a transformer `name` with require.resolve, so a workspace-relative
// path never matches. Both targets get the same absolute path, written here so
// the repro stays portable across machines.
const transformer = resolve(__dirname, 'marker-transformer.js');

const shared = {
  main: 'apps/demo/src/main.ts',
  tsConfig: 'apps/demo/tsconfig.json',
  target: 'node',
  outputHashing: 'none',
  optimization: false,
  transformers: [{ name: transformer }],
};

const projectJson = {
  name: 'demo',
  projectType: 'application',
  sourceRoot: 'apps/demo/src',
  targets: {
    'build-webpack': {
      executor: '@nx/webpack:webpack',
      options: {
        ...shared,
        webpackConfig: 'apps/demo/webpack.config.js',
        outputPath: 'dist/webpack',
        compiler: 'tsc',
      },
    },
    'build-rspack': {
      executor: '@nx/rspack:rspack',
      options: {
        ...shared,
        rspackConfig: 'apps/demo/rspack.config.js',
        outputPath: 'dist/rspack',
      },
    },
  },
};

writeFileSync(
  join(__dirname, '..', 'apps', 'demo', 'project.json'),
  JSON.stringify(projectJson, null, 2) + '\n'
);
