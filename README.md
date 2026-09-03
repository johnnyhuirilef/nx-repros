# nx-repros

Minimal, self-contained reproductions for issues I've reported against
[nrwl/nx](https://github.com/nrwl/nx).

Each directory is one reproduction: its own `package.json` with pinned
versions, and a README with the exact commands and the output to expect.

| Directory | Issue | What it shows |
|---|---|---|
| [`rspack-ignores-transformers`](./rspack-ignores-transformers) | [#36875](https://github.com/nrwl/nx/issues/36875) | `@nx/rspack:rspack` declares a `transformers` option and never reads it — the build reports success while the transformer never runs |
| [`nest-bundler-decorator-metadata`](./nest-bundler-decorator-metadata) | *(pending)* | `@nx/nest` hardcodes webpack; esbuild would build a Nest app that boots and then answers 500 |
