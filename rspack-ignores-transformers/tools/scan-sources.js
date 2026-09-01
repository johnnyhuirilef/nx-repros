const { readFileSync, readdirSync, statSync, existsSync } = require('fs');
const { join, resolve } = require('path');

// Classify every `transformers` reference in the installed packages as a
// declaration/default or as a real read. Only a read can make the option work.
const modules = resolve(__dirname, '..', 'node_modules');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== 'node_modules') walk(path, out);
    } else if (/\.js$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

for (const pkg of ['rspack', 'webpack']) {
  const dist = join(modules, '@nx', pkg, 'dist');
  console.log(`\n===== @nx/${pkg} =====`);
  if (!existsSync(dist)) {
    console.log('  not installed — run `npm install` first');
    continue;
  }

  let reads = 0;
  for (const file of walk(dist)) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        if (!line.includes('transformers')) return;
        const declares = /transformers\s*\?\?=|transformers\s*:|"transformers"/.test(line);
        if (!declares) reads++;
        const kind = declares ? 'DECLARE/DEFAULT' : 'READ';
        console.log(`  [${kind}] ${file.slice(modules.length + 1)}:${index + 1}`);
        console.log(`      ${line.trim()}`);
      });
  }
  console.log(`  --> READ count: ${reads}`);
}
