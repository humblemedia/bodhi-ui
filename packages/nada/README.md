# Nada

A local-first music player built with [Bodhi](../../README.md). Nada plays audio files from your filesystem — no accounts, no cloud, no telemetry. Your files stay on your machine.

This is the first application built with the Bodhi framework.

## Build

```
node build.js
```

Compiles YAML specs from `src/specs/` to static HTML/CSS/JS in `dist/`.

## Run

Serve `dist/` with any static file server:

```
npx serve dist
```

Then open `http://localhost:3000` in your browser.

## Browser Support

- **Chromium** (Chrome, Edge, Brave): full support, including persistent folder access via File System Access API.
- **Gecko** (Firefox): works, but the user must re-select their music folder each session (no persistent handles).

## Architecture

```
src/specs/*.bodhi.yaml   Declarative UI specs (Bodhi YAML)
src/cetana/              Reactive logic (Cetana signals)
  app.js                 Global state, actions, init
  views.js               Pagination, breadcrumb drill-down
  library.js             Metadata indexing, OPFS cache
  player.js              Web Audio playback, MediaSession
  render.js              Wires compiled HTML to Cetana signals
src/workers/             Web Workers (metadata parsing)
src/static/              Service worker, theme CSS
build.js                 Compiler entry point
dist/                    Build output (serve this)
```

The Bodhi compiler transforms YAML specs into semantic HTML with ARIA attributes. Cetana provides reactivity (signals, computed values, list rendering). No bundler — ES modules loaded natively by the browser.

## Principles

- No auto-play. The user initiates every action.
- No scroll. Content is paginated.
- No telemetry. Zero network requests.
- No frameworks. Cetana is the reactive layer.
- Honest UI. Real progress counts, not fake spinners.
