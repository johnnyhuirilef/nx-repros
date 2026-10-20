# `--bundler` is ignored when the framework is Nest

`nx g @nx/node:application --framework=nest --bundler=rolldown` generates a
webpack application. The option is accepted and then dropped, with no warning.

`@nx/node` forwards all its options, `bundler` included, to `@nx/nest`. The Nest
generator then sets `bundler: 'webpack'` itself
(`packages/nest/src/generators/application/lib/normalize-options.ts`), so the
value never reaches the application.

Related: [nrwl/nx#36913](https://github.com/nrwl/nx/issues/36913) covers the
same hardcoded line from the `@nx/nest` side.

## Run it

```bash
npm install
npm run check
```

The script creates a fresh workspace with every Nx package pinned to
`24.0.0-beta.3`, generates two applications, and reports which bundler each got.

## What you should see

```
nx g @nx/node:application --framework=none --bundler=rolldown  -> rolldown
nx g @nx/node:application --framework=nest --bundler=rolldown  -> webpack

CONFIRMED: --bundler=rolldown is honored without a framework and
           silently ignored with --framework=nest.
```

The first line is the control: the same option works when the framework is not
Nest.

## Notes

`create-nx-workspace@24.0.0-beta.3` pins `nx` and `@nx/js` to `23.2.0` in the
workspace it creates. The script aligns them to `24.0.0-beta.3` before it
generates anything, so the Nx packages in the workspace share one version.
