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

// ── Compile all specs ────────────────────────────────────────
const specFiles = readdirSync(SPECS_DIR).filter(f => f.endsWith('.bodhi.yaml'));
const compiled = {};  // file → { html, css, js }
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

  compiled[file] = result;
  allCss.push(`/* ${file} */\n${result.css}`);
  if (result.js) allJs.push(`/* ${file} */\n${result.js}`);

  console.log(`  Compiled: ${file}`);
}

// ── Assemble shell with view specs injected into tab panels ──
const VIEW_PANEL_MAP = {
  'artists.bodhi.yaml': 'artists',
  'albums.bodhi.yaml': 'albums',
  'queue.bodhi.yaml': 'queue',
  'settings.bodhi.yaml': 'settings',
};

let shellHtml = compiled['shell.bodhi.yaml'].html;

// Inject each view spec's HTML into the matching tab panel.
// Strategy: find the panel's opening tag (with its id), find its closing tag,
// and replace everything between them with the view HTML.
for (const [specFile, panelId] of Object.entries(VIEW_PANEL_MAP)) {
  if (!compiled[specFile]) continue;
  const viewHtml = compiled[specFile].html;

  // Find `id="<panelId>"` in the shell, then locate the element boundaries.
  // The panels are: <div ...id="artists"...>...</div> or <ul ...id="queue"...>...</ul>
  // or <article ...id="settings"...>...</article>
  const idMarker = `id="${panelId}"`;
  const idPos = shellHtml.indexOf(idMarker);
  if (idPos === -1) continue;

  // Walk backward to find the opening `<`
  let openStart = idPos;
  while (openStart > 0 && shellHtml[openStart] !== '<') openStart--;

  // Get the tag name
  const tagMatch = shellHtml.substring(openStart).match(/^<(\w+)/);
  if (!tagMatch) continue;
  const tagName = tagMatch[1];

  // Find the end of the opening tag
  const openEnd = shellHtml.indexOf('>', idPos) + 1;

  // Find the matching closing tag (simple: first </tagName> after openEnd
  // accounting for the fact panels don't nest the same tag deeply)
  // Use a depth counter for accuracy
  let depth = 1;
  let pos = openEnd;
  const openPattern = new RegExp(`<${tagName}[\\s>]`);
  while (depth > 0 && pos < shellHtml.length) {
    const nextOpen = shellHtml.indexOf(`<${tagName}`, pos);
    const nextClose = shellHtml.indexOf(`</${tagName}>`, pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Check it's actually an opening tag (not a substring)
      const charAfterTag = shellHtml[nextOpen + tagName.length + 1];
      if (charAfterTag === ' ' || charAfterTag === '>' || charAfterTag === '/') {
        depth++;
      }
      pos = nextOpen + tagName.length + 1;
    } else {
      depth--;
      if (depth === 0) {
        // Replace content between openEnd and nextClose
        shellHtml = shellHtml.substring(0, openEnd) +
          `\n      ${viewHtml}\n    ` +
          shellHtml.substring(nextClose);
        break;
      }
      pos = nextClose + tagName.length + 3;
    }
  }
}

// Inject album-detail as an additional view panel inside garbha-content
if (compiled['album-detail.bodhi.yaml']) {
  const detailHtml = compiled['album-detail.bodhi.yaml'].html;
  // Find the closing </main> of garbha-content and insert before it
  const garbhaContentIdx = shellHtml.indexOf('garbha-content');
  if (garbhaContentIdx !== -1) {
    // Find the </main> that closes garbha-content
    const afterGarbha = shellHtml.indexOf('</main>', garbhaContentIdx);
    if (afterGarbha !== -1) {
      const albumDetailPanel = `    <article class="darsana album-detail" data-bodhi-view="album-detail" id="album-detail" data-bodhi-hidden="true">\n        ${detailHtml}\n      </article>\n  `;
      shellHtml = shellHtml.substring(0, afterGarbha) + albumDetailPanel + shellHtml.substring(afterGarbha);
    }
  }
}

// The assembled HTML is just the shell (with views injected)
const assembledHtml = shellHtml;

// Write combined outputs
writeFileSync(join(DIST_DIR, 'components.html'), assembledHtml, 'utf8');
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

// Build index.html programmatically — no regex, every piece guaranteed present
writeFileSync(join(DIST_DIR, 'index.html'), generateIndexHtml(), 'utf8');

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
  const compiledMarkup = assembledHtml;
  return `<!DOCTYPE html>
<html lang="en" data-bodhi-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nāda — Local Music Player</title>
  <link rel="stylesheet" href="components.css">
  <link rel="stylesheet" href="theme.css">
  <script type="importmap">
  {
    "imports": {
      "@bodhi/cetana": "./lib/cetana/index.js",
      "browser-fs-access": "https://cdn.jsdelivr.net/npm/browser-fs-access@0.35.0/dist/index.modern.js",
      "music-metadata": "https://cdn.jsdelivr.net/npm/music-metadata-browser@2.5.10/dist/index.mjs"
    }
  }
  </script>
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
  <div id="nada-root">
    ${compiledMarkup}
  </div>

  <script type="module">
    import { initApp } from './cetana/app.js';
    const root = document.getElementById('nada-root');
    initApp(root);
  </script>

  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  </script>
</body>
</html>`;
}
