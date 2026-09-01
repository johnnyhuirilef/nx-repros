# `@nx/rspack:rspack` accepts a `transformers` option it never runs

The `@nx/rspack:rspack` executor declares a `transformers` option in its
schema. Nothing in the package ever reads it. The build prints no warning, exits
0, and reports `Rspack compiled successfully` — while the TypeScript transformer
never runs.

`@nx/webpack:webpack` runs the same option correctly, so the two arms below
differ only in the bundler.

## Run it

```bash
npm install
npm run build   # builds the same project with webpack, then with rspack
npm run check   # runs both bundles and compares what they print
npm run scan    # classifies every `transformers` reference in both packages
```

## What you should see

```
######## npm run build ########
webpack compiled successfully (2abbf8eb6bfa2e79)
Rspack compiled successfully (16569b3a7ab0e88d)

######## npm run check ########
webpack bundle prints   TRANSFORMER_RAN
rspack bundle prints    TRANSFORMER_DID_NOT_RUN

IGNORED: rspack accepted the transformers option and never ran it
         the build reported success and printed no warning

######## npm run scan ########
===== @nx/rspack =====
  [DECLARE/DEFAULT] @nx/rspack/dist/src/plugins/utils/apply-base-config.js:36
      options.transformers ??= [];
  --> READ count: 0

===== @nx/webpack =====
  [DECLARE/DEFAULT] @nx/webpack/dist/.../lib/apply-base-config.js:33
      options.transformers ??= [];
  [READ] @nx/webpack/dist/.../lib/compiler-loaders.js:34
      const { compilerPluginHooks, hasPlugin } = loadTsTransformers(options.transformers);
  --> READ count: 1
```

Both targets get the same `transformers` option, the same entry file and the
same tsconfig. The transformer rewrites one string literal, so the value each
bundle prints says whether it ran.

`npm run check` runs the bundles instead of grepping them, because the source
comment carries the marker text too.

## Why it happens

In `@nx/webpack` the option reaches `ts-loader` through a real consumer:

```ts
// packages/webpack/src/plugins/nx-webpack-plugin/lib/compiler-loaders.ts:36
case 'tsc':
  const { loadTsTransformers } = require('@nx/js');
  const { compilerPluginHooks, hasPlugin } = loadTsTransformers(
    options.transformers
  );
```

`@nx/rspack` has the declarations and the default, but no equivalent consumer:

| File | Line | Action |
|---|---|---|
| `packages/rspack/src/executors/rspack/schema.json` | 299 | declares the option |
| `packages/rspack/src/executors/rspack/schema.d.ts` | 49 | declares the type |
| `packages/rspack/src/plugins/utils/models.ts` | 232 | declares the type |
| `packages/rspack/src/plugins/utils/apply-base-config.ts` | 59 | sets `options.transformers ??= []` |

The cause is the loader. Rspack compiles TypeScript with `builtin:swc-loader`
(`packages/rspack/src/plugins/utils/apply-base-config.ts:525`). SWC cannot run
TypeScript transformer plugins.

The option arrived with two pull requests that moved the rspack executor to the
webpack structure — [#28825](https://github.com/nrwl/nx/pull/28825) and
[#28913](https://github.com/nrwl/nx/pull/28913). They copied the schema. They
could not copy the consumer.

## Who runs into this

Anything that depends on a TypeScript transformer and moves to rspack. The
`@nestjs/swagger` CLI plugin is one: a NestJS application loses its generated
schema metadata, and the build still reports success.

Nx also deprecates `@nx/webpack:webpack` in favour of rspack, so this path gets
more traffic over time.

## Notes for anyone extending this repro

Three details cost time:

- Nx resolves a transformer `name` with `require.resolve`, so a
  workspace-relative path never matches. `tools/` is therefore a local package
  named `marker-transformer`, linked through `file:tools`.
- The rspack config must use `composePlugins(withNx(), ...)`. If
  `rspack.config.js` exports a plain object, `getRspackConfigs` returns it
  unchanged and discards the generated config, and the build fails with
  `Entry is required`.
- Nx obeys `.gitignore` when it looks for projects. An ignored `project.json`
  makes `nx show projects` return `[]`.

## Versions

`nx` 23.1.3 · `@nx/rspack` 23.1.3 · `@nx/webpack` 23.1.3 ·
`@rspack/core` 2.2.1 · `typescript` 5.9.3 · Node 24.19.0
