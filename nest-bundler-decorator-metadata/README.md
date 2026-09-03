# `@nx/nest:application` hardcodes webpack, and esbuild would break the app

Reported as [nrwl/nx#36913](https://github.com/nrwl/nx/issues/36913).

`@nx/nest:application` sets its bundler to webpack and offers no way to change
it. The option is absent from the schema, and the schema sets
`"additionalProperties": false`, so `--bundler=esbuild` is rejected rather than
ignored.

This reproduction shows why the choice matters and why esbuild cannot simply be
offered: a Nest app built with esbuild **compiles, boots, logs
`Nest application successfully started`, and then answers 500 on the first
request**.

## Run it

```bash
npm install
npm run build   # webpack (the generated config), esbuild, rspack
npm run check   # starts each bundle and asks it for GET /api
```

## What you should see

```
webpack   GET /api -> 200 {"message":"from-repo"}                     design:paramtypes after AppController: 3
esbuild   GET /api -> 500 {"statusCode":500,"message":"Internal server error"}  design:paramtypes after AppController: 0
rspack    GET /api -> 200 {"message":"from-repo"}                     design:paramtypes after AppController: 2

CONFIRMED: esbuild builds and boots, then answers 500, because it emits
           no design:paramtypes and Nest injects undefined.
           webpack and rspack answer 200.
```

The app comes from a real `nx g @nx/nest:application`. The only edit is a
two-level provider chain, `AppController -> AppService -> RepoService`.

## Why it happens

Nest resolves constructor injection through `design:paramtypes`, the metadata
that TypeScript emits under `emitDecoratorMetadata`. esbuild has no type
checker, so it cannot know a parameter's type and emits none, whatever the
tsconfig says.

In the esbuild bundle the controller decorates but carries no metadata:

```js
AppController = __decorateClass([Controller()], AppController);
```

Nest injects `undefined` and the first request throws
`TypeError: Cannot read properties of undefined (reading 'getData')`.

rspack compiles through `builtin:swc-loader`, and SWC does implement the
transform. `@nx/rspack` already passes the flags it needs
(`packages/rspack/src/plugins/utils/apply-base-config.ts`):

```ts
transform: { legacyDecorator: true, decoratorMetadata: true }
```

## Two traps if you extend this

- **The default scaffold cannot show the failure.** Its `AppService` has no
  constructor dependency, so Nest resolves nothing and the request succeeds
  under every bundler. The provider chain here exists for that reason.
- **Checking that the app boots proves nothing.** All three bundles start and
  log success. Only a request separates them, which is why `check` sends one
  instead of reading the log.

A third trap, for the metadata count: each compiler names its helper
differently (`tslib_1.__metadata` for tsc, `_ts_metadata` for SWC), and a source
comment that mentions `design:paramtypes` survives into the esbuild bundle. The
count matches the emitted call, not the words.

## Versions

`nx` 23.2.0 · `@nx/nest` 23.2.0 · `@nx/node` 23.2.0 · `@nx/webpack` 23.2.0 ·
`@nx/esbuild` 23.2.0 · `@nx/rspack` 23.2.0 · `@rspack/core` 2.x ·
`esbuild` 0.28.x · Node 24
