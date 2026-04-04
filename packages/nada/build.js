#!/usr/bin/env node

/**
 * Nāda Build Script
 *
 * Compiles all .bodhi.yaml specs and assembles the static site in dist/.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { compile } from '@bodhi/compiler';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const SPECS_DIR = resolve(ROOT, 'src/specs');
const DIST_DIR = resolve(ROOT, 'dist');
const STATIC_DIR = resolve(ROOT, 'src/static');

// Ensure dist exists
mkdirSync(DIST_DIR, { recursive: true });

console.log('Nāda Build');
console.log('==========\n');

// Compile all specs
const specFiles = readdirSync(SPECS_DIR).filter(f => f.endsWith('.bodhi.yaml'));
const allHtml = [];
const allCss = [];
const allJs = [];

for (const file of specFiles) {
  const yaml = readFileSync(join(SPECS_DIR, file), 'utf8');
  const result = compile(yaml);

  if (result.errors.length > 0) {
    console.error(`Errors in ${file}:`);
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  allHtml.push(`<!-- ${file} -->\n${result.html}`);
  allCss.push(`/* ${file} */\n${result.css}`);
  if (result.js) allJs.push(`/* ${file} */\n${result.js}`);

  console.log(`  Compiled: ${file}`);
}

// Write combined outputs
writeFileSync(join(DIST_DIR, 'components.html'), allHtml.join('\n\n'), 'utf8');
writeFileSync(join(DIST_DIR, 'components.css'), allCss.join('\n'), 'utf8');
if (allJs.length) {
  // Deduplicate import statements across combined JS
  const combinedJs = allJs.join('\n\n');
  const importLines = new Set();
  const bodyLines = [];
  for (const line of combinedJs.split('\n')) {
    if (line.startsWith('import ')) {
      importLines.add(line);
    } else {
      bodyLines.push(line);
    }
  }
  const deduped = [...importLines, '', ...bodyLines].join('\n');
  writeFileSync(join(DIST_DIR, 'components.js'), deduped, 'utf8');
}

// Build index.html with inlined compiled HTML
const indexSrc = resolve(ROOT, 'src/index.html');
try {
  let indexContent = readFileSync(indexSrc, 'utf8');
  // Inject compiled HTML into #nada-root
  const compiledMarkup = allHtml.join('\n  ');
  indexContent = indexContent.replace(
    /<!-- Compiled Bodhi components injected here by build -->\s*<div id="nada-root"><\/div>/,
    `<div id="nada-root">\n  ${compiledMarkup}\n  </div>`
  );
  writeFileSync(join(DIST_DIR, 'index.html'), indexContent, 'utf8');
} catch {
  // Generate a default index.html
  writeFileSync(join(DIST_DIR, 'index.html'), generateIndexHtml(), 'utf8');
}

// Copy static files (service worker, theme CSS)
try {
  copyFileSync(join(STATIC_DIR, 'sw.js'), join(DIST_DIR, 'sw.js'));
} catch {
  console.log('  No service worker found, skipping.');
}
try {
  copyFileSync(join(STATIC_DIR, 'theme.css'), join(DIST_DIR, 'theme.css'));
} catch {
  // No theme CSS — that's fine
}

// Copy Cetanā library to dist/lib/cetana/ (for import map resolution)
const CETANA_LIB_DIR = resolve(ROOT, '..', 'cetana', 'src');
try {
  mkdirSync(join(DIST_DIR, 'lib', 'cetana'), { recursive: true });
  const cetanaLibFiles = readdirSync(CETANA_LIB_DIR).filter(f => f.endsWith('.js'));
  for (const f of cetanaLibFiles) {
    copyFileSync(join(CETANA_LIB_DIR, f), join(DIST_DIR, 'lib', 'cetana', f));
  }
} catch (e) {
  console.log('  Could not copy Cetanā library:', e.message);
}

// Copy cetana app modules to dist
const CETANA_DIR = resolve(ROOT, 'src/cetana');
try {
  mkdirSync(join(DIST_DIR, 'cetana'), { recursive: true });
  const cetanaFiles = readdirSync(CETANA_DIR).filter(f => f.endsWith('.js'));
  for (const f of cetanaFiles) {
    copyFileSync(join(CETANA_DIR, f), join(DIST_DIR, 'cetana', f));
  }
} catch {
  // No cetana modules — that's fine
}

// Copy web worker
const WORKERS_DIR = resolve(ROOT, 'src/workers');
try {
  mkdirSync(join(DIST_DIR, 'workers'), { recursive: true });
  const workers = readdirSync(WORKERS_DIR).filter(f => f.endsWith('.js'));
  for (const w of workers) {
    copyFileSync(join(WORKERS_DIR, w), join(DIST_DIR, 'workers', w));
  }
} catch {
  // No workers — that's fine
}

console.log(`\nBuild complete → ${DIST_DIR}/`);

function generateIndexHtml() {
  return `<!DOCTYPE html>
<html lang="en" data-bodhi-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nāda — Local Music Player</title>
  <link rel="stylesheet" href="components.css">
  <style>
    :root {
      --bodhi-akasa-sparsa: 0.125rem;
      --bodhi-akasa-svasa: 0.5rem;
      --bodhi-akasa-vicara: 1rem;
      --bodhi-grid-min: 12rem;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: system-ui, sans-serif; }
    [data-bodhi-theme="dark"] { background: #1a1a1a; color: #eee; }
    [data-bodhi-theme="light"] { background: #fafafa; color: #222; }
    [data-bodhi-hidden="true"] { display: none; }
  </style>
</head>
<body>
  ${allHtml.join('\n  ')}
  <script type="module" src="components.js"></script>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  </script>
</body>
</html>`;
}
