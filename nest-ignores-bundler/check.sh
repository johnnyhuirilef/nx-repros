#!/usr/bin/env bash
# Generates two apps in a fresh workspace and reports which bundler each one got.
set -euo pipefail

VERSION=24.0.0-beta.3
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"

npx --yes create-nx-workspace@$VERSION ws --preset=apps --pm=npm \
  --nxCloud=skip --no-interactive --skipGit >/dev/null 2>&1
cd ws

# create-nx-workspace pins nx and @nx/js, so align every Nx package.
npm i -D --save-exact --silent \
  nx@$VERSION @nx/js@$VERSION @nx/devkit@$VERSION @nx/node@$VERSION \
  @nx/nest@$VERSION @nx/rolldown@$VERSION @nx/webpack@$VERSION @nx/web@$VERSION \
  >/dev/null 2>&1

npx nx g @nx/node:application plain --framework=none --bundler=rolldown \
  --no-interactive >/dev/null 2>&1
npx nx g @nx/node:application nest --framework=nest --bundler=rolldown \
  --no-interactive >/dev/null 2>&1

bundler_of() {
  if [ -f "$1/rolldown.config.ts" ]; then echo rolldown
  elif [ -f "$1/webpack.config.js" ]; then echo webpack
  else echo unknown; fi
}

PLAIN="$(bundler_of plain)"
NEST="$(bundler_of nest)"

echo "nx g @nx/node:application --framework=none --bundler=rolldown  -> $PLAIN"
echo "nx g @nx/node:application --framework=nest --bundler=rolldown  -> $NEST"
echo

if [ "$PLAIN" = rolldown ] && [ "$NEST" = webpack ]; then
  echo "CONFIRMED: --bundler=rolldown is honored without a framework and"
  echo "           silently ignored with --framework=nest."
else
  echo "NOT REPRODUCED"
  exit 1
fi
