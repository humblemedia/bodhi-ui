# Bodhi Semantic Compiler + Cetanā + Nāda

## What You Are Building

You are building three things in sequence, each depending on the last:

1. **The Bodhi semantic compiler** — a CLI command (`bodhi compile`) that takes YAML component specifications written in Bodhi's Yantra/Mudrā vocabulary and emits semantic HTML + CSS that uses the Bodhi token system.

2. **Cetanā (चेतना)** — Bodhi's reactive layer. A tiny (~200 lines) JavaScript module providing signals, computed values, and keyed list rendering. No virtual DOM. No build step required. Direct DOM manipulation. This is Bodhi's answer to "how do interactive components work."

3. **Nāda (नाद)** — A browser-based local music player that plays audio files from the user's filesystem. The first application built with Bodhi. Uses the semantic compiler for its UI structure and Cetanā for its interactivity. Zero telemetry, zero accounts, zero cloud. Files never leave the browser.

## Before You Do Anything

Run through this checklist. Every time you start a new iteration, run through this checklist again. Do not skip it.

### Status Checklist

```
[ ] Read this entire prompt
[ ] Check git log to understand what work has been done
[ ] Check if packages/compiler/ exists and what state it's in
[ ] Check if packages/cetana/ exists and what state it's in
[ ] Check if packages/nada/ (or nada/ or site/nada/) exists and what state it's in
[ ] Run `npm test --workspaces` to see what tests exist and whether they pass
[ ] Run `npx bodhi compile --help` to see if the compile command is registered
[ ] Check if packages/tokens/src/lookup/yantras.js exists
[ ] Check if packages/tokens/src/lookup/mudras.js exists
[ ] Review the TODO list at the bottom of this file and identify the highest-priority incomplete item
[ ] Begin work on that item
```

## Architecture Context

### What Already Exists

The bodhi repo is a monorepo with three packages:

- `packages/eslint-plugin-bodhi` — Complete. 9 dark pattern detection rules with koan messages. Do not modify.
- `packages/cli` — Partially complete. Has `init`, `lint`, `token compile`, and a stubbed `report` command. The `token compile` command (909 lines in `src/commands/token.js`) is the reference implementation for how compilation works in Bodhi. Study it.
- `packages/tokens` — Complete. Poetic token lookup (11 tokens across spatial/color/voice categories), Rūpa schema validator, WCAG AAA contrast calculator.

The token system generates CSS custom properties from a `bodhi.rupa.json` brand file. The compiler you're building generates HTML that *uses* those CSS custom properties. The ESLint plugin validates the output for dark patterns. All three layers work together.

### What You Are Adding

- `packages/compiler` — New package. The semantic compiler.
- `packages/cetana` — New package. The reactive layer.
- `packages/nada` — New package. The music player application.

Register these as workspaces in the root `package.json`.

### The Existing Naming Conventions

Bodhi uses Sanskrit terminology throughout. This is not decoration — it's productive friction that forces developers to think about what UI elements *mean*. Follow the existing patterns:

- Rūpa (रूप) = appearance/form (the token/theming system)
- Yantra (यन्त्र) = instrument/device (semantic UI constructs)
- Mudrā (मुद्रा) = gesture/seal (behavior qualities)
- Cetanā (चेतना) = consciousness/volition (reactive layer)
- Nirmāṇa (निर्माण) = creation/structure (component structural defaults)

CSS custom properties follow: `--bodhi-{category}-{token-name}`
Data attributes follow: `data-bodhi-{type}="{value}"`
Class names use the Sanskrit component name: `.siras`, `.pada`, `.garbha`, etc.

---

## Phase 1: Yantra and Mudrā Definitions

### Yantras (Semantic Constructs)

The extraction reference document names 7 of 22 planned Yantras. **Do not invent all 22 right now.** Define only the ones Nāda actually needs, plus any that are obvious and universal. Each Yantra must have:

- Sanskrit name + Devanagari script
- English purpose description
- HTML element(s) it maps to
- ARIA role (if applicable)
- Default semantic attributes

**Yantras Nāda needs:**

| Yantra | Purpose | HTML | Notes |
|--------|---------|------|-------|
| Sūci (सूचि) | List/sequence | `<ul>`, `<ol>` | Track lists, queue, artist grid |
| Kriyā (क्रिया) | Action/trigger | `<button>` | Play, pause, next, prev, tab buttons |
| Darśana (दर्शन) | Display/presentation | `<article>`, `<section>` | Album detail, now-playing bar |
| Vākya (वाक्य) | Text content | `<p>`, `<h1>`-`<h6>`, `<span>` | Track titles, artist names, labels |
| Praveśa (प्रवेश) | Input/entry | `<input>` | Search (future), volume slider |
| Panthā (पन्था) | Navigation/wayfinding | `<nav>` | Tab bar, breadcrumbs |
| Saṅgraha (सङ्ग्रह) | Collection/gallery | `<div role="grid">` | Card grids (artists, albums) |
| Śiras (शिरस्) | Header/banner | `<header>` | App header, folder bar |
| Pāda (पाद) | Footer/ground | `<footer>` | Now-playing bar (semantic footer) |
| Garbha (गर्भ) | Body/main content | `<main>` | Primary content area |
| Bindu (बिन्दु) | Single focus item | `<article>` | Individual card, individual track row |

If you identify additional Yantras that Nāda needs, add them. But do not pad the list with constructs that have no immediate use. They can be added when a project needs them.

### Mudrās (Gesture Qualities)

Same principle — define what Nāda needs:

| Mudrā | Quality | CSS Effect | Notes |
|-------|---------|-----------|-------|
| Stūpa (स्तूप) | Stacking | `flex-direction: column` | Vertical layouts |
| Jāla (जाल) | Grid/network | `display: grid` | Card grids, track rows |
| Sthira (स्थिर) | Fixed/sticky | `position: sticky/fixed` | Now-playing bar, header |
| Cala (चल) | Motion/transition | CSS transitions | View transitions, hover states |
| Gupta (गुप्त) | Hidden/revealed | `display: none/block` toggling | Tab views, conditional content |
| Pūrṇa (पूर्ण) | Full-width | `width: 100%` | Full-bleed elements |
| Saṃkṣipta (संक्षिप्त) | Compact/dense | Reduced spacing | Track rows in list view |

Create these as lookup tables in `packages/tokens/src/lookup/yantras.js` and `packages/tokens/src/lookup/mudras.js`, following the pattern established in `poetic-tokens.js`.

---

## Phase 2: The Semantic Compiler

### Input Format

YAML files with `.bodhi.yaml` extension. A component spec looks like:

```yaml
# nada-shell.bodhi.yaml
component: NadaShell
yantra: Garbha
mudras: [Stūpa]
attributes:
  data-bodhi-yantra: garbha
  role: main

children:
  - component: Header
    yantra: Śiras
    mudras: [Sthira, Pūrṇa]
    children:
      - yantra: Vākya
        element: span
        class: siras-identity
        content: "Nāda"

  - component: FolderBar
    yantra: Darśana
    mudras: [Pūrṇa, Saṃkṣipta]
    class: folder-bar
    children:
      - yantra: Vākya
        class: folder-path
        content: ""
        bind: folderPath
      - yantra: Kriyā
        class: folder-btn
        content: "Select Music Folder"
        on: { click: openFolder }

  - component: MainContent
    yantra: Garbha
    mudras: [Gupta]
    class: garbha
    views:
      - id: artists
        yantra: Saṅgraha
        mudras: [Jāla]
        bind: artistCards
      - id: albums
        yantra: Saṅgraha
        mudras: [Jāla]
        bind: albumCards
      - id: queue
        yantra: Sūci
        bind: queueItems

  - component: NowPlaying
    yantra: Pāda
    mudras: [Sthira, Pūrṇa]
    bind: currentTrack
```

### Output Format

The compiler emits:

1. **An HTML file** — semantic markup using Bodhi class names and data attributes.
2. **A CSS file** — component-specific styles that reference Bodhi token variables.
3. **A JS file** (if `bind` or `on` properties are present) — Cetanā-based component code.

The HTML output for a Yantra includes:
- The correct semantic HTML element
- `data-bodhi-yantra="{name}"` attribute
- `data-bodhi-mudra="{space-separated mudra names}"` attribute
- ARIA attributes based on the Yantra's role
- Bodhi CSS class name

### Implementation

Create `packages/compiler/` with:

```
packages/compiler/
  package.json
  src/
    index.js          — Public API: compile(yamlString, options) → { html, css, js }
    parser.js         — YAML parsing and validation against Yantra/Mudrā schema
    emitters/
      html.js         — Yantra → HTML element mapping + attribute generation
      css.js          — Mudrā → CSS class generation + token references
      js.js           — Event binding + Cetanā integration code generation
    schema.js         — Component spec validation
  test/
    compiler.test.js  — Tests for each Yantra/Mudrā combination
```

Register as a CLI command: `bodhi compile <input.bodhi.yaml> -o <output-dir>`

Add the command to `packages/cli/src/index.js` following the pattern used by `token compile`.

### Key Constraint: Bodhi No-Scroll

The compiler must enforce `overflow: hidden` on any `Garbha` (main content) Yantra. This is Bodhi's no-scroll dogma. Content must be paginated, not scrolled. If a `Saṅgraha` (collection) Yantra has more items than fit in the viewport, the compiler should emit pagination controls automatically.

---

## Phase 3: Cetanā — The Reactive Layer

### Location

`packages/cetana/` with:

```
packages/cetana/
  package.json
  src/
    index.js      — Public API exports
    signal.js     — Reactive signals
    computed.js   — Derived/computed signals
    list.js       — Keyed list rendering with efficient diffing
    component.js  — Component mount/unmount lifecycle
  test/
    signal.test.js
    list.test.js
```

### API

```javascript
import { signal, computed, list, mount } from 'bodhi-cetana';

// Signal — reactive value
const count = signal(0);
count.get();              // 0
count.set(1);             // triggers subscribers
count.subscribe(fn);      // returns unsubscribe function

// Computed — derived value
const doubled = computed(() => count.get() * 2, [count]);
doubled.get();            // 2 (auto-updates when count changes)

// List — efficient keyed list rendering
list(containerEl, itemsSignal, {
  key: item => item.id,           // stable identity
  render: item => createTrackRow(item),  // returns DOM element
  update: (el, item) => { ... }   // optional: update existing element
});
// When itemsSignal changes, list diffs by key:
//   - new keys → render() called, element inserted
//   - removed keys → element removed
//   - existing keys → update() called if provided, element reused
//   - reordered keys → elements moved in DOM

// Mount — component lifecycle
const cleanup = mount(element, (el) => {
  // Set up subscriptions, event listeners
  const unsub = currentTrack.subscribe(track => {
    el.querySelector('.title').textContent = track.title;
  });

  // Return cleanup function
  return () => { unsub(); };
});
cleanup(); // unmount
```

### Design Principles for Cetanā

- **No virtual DOM.** Direct DOM manipulation only.
- **No build step.** Works as ES modules loaded directly in the browser.
- **No templating language.** DOM is created with `document.createElement` or `innerHTML` where appropriate.
- **Batch updates.** If multiple signals change synchronously, DOM updates should be batched into a single frame using `requestAnimationFrame` or microtask.
- **Memory safe.** When a component is unmounted via `cleanup()`, all subscriptions are released. No leaks.
- **Small.** Target under 200 lines total for all four modules. If it's getting bigger, you're overengineering it.

### Testing

Write tests that run in Node.js using jsdom or similar. Test:
- Signal get/set/subscribe/unsubscribe
- Computed auto-updates and cleanup
- List diffing: insert, remove, reorder, update
- Component mount and cleanup
- Batch update coalescing

---

## Phase 4: Nāda — The Music Player

### Architecture

Nāda is a static web application. It consists of:
- HTML generated by the Bodhi compiler from `.bodhi.yaml` specs
- CSS using Bodhi tokens (generated by `bodhi token compile`)
- JavaScript using Cetanā for reactivity
- A service worker for offline support

The application files live in `packages/nada/`.

```
packages/nada/
  package.json
  bodhi.rupa.json         — Nāda's brand tokens (could extend default Bodhi tokens)
  src/
    specs/                 — Bodhi YAML component specs
      shell.bodhi.yaml     — App shell (header, folder bar, main, now-playing, tabs)
      artists.bodhi.yaml   — Artists view
      albums.bodhi.yaml    — Albums view
      album-detail.bodhi.yaml
      queue.bodhi.yaml
      settings.bodhi.yaml
    cetana/                — Cetanā component logic
      app.js               — App initialization, folder access, signals
      library.js           — Library indexing, metadata parsing
      player.js            — Audio playback (Web Audio API)
      views.js             — View switching, pagination
    static/
      sw.js                — Service worker
    index.html             — Entry point (loads compiled components + Cetanā)
  build.js                 — Runs bodhi compile on all specs, bundles output
  dist/                    — Build output (deployable static site)
```

### Core Dependencies

- `browser-fs-access` — Unified file access across Chromium (File System Access API) and Gecko (file input fallback)
- `music-metadata` — Client-side ID3/metadata parsing (supports MP3, FLAC, AAC, Ogg, WAV, M4A)
- `opfs-tools` or `opfs-cache` — OPFS wrapper for metadata index persistence

These are the only external dependencies. Everything else is Bodhi.

### Key Behaviors

**File Access:**
- Primary path: `browser-fs-access.directoryOpen({ recursive: true })` gives persistent directory handle (Chromium) or file objects (Gecko)
- Folder bar shows current path. Button says "Select Music Folder" (or "Change Folder" when loaded)
- If no folder selected, main area shows a notice explaining what to do (not a wizard, not a splash screen)

**Metadata Indexing:**
- On first folder access, parse all audio file metadata using `music-metadata` with `skipCovertArt: true` for speed
- Run parsing in a Web Worker to prevent UI blocking
- Cache full index in OPFS (keyed by path + size + modified date)
- On subsequent folder access, diff incoming files against cached index — only parse new/changed files
- Album art extracted lazily on-demand when user navigates to an album

**Library Views:**
- Artists and Albums tabs show paginated card grids (Bodhi no-scroll constraint)
- Breadcrumb navigation: Artists → [Artist Name] → [Album Title] → tracks
- Additional taxonomy views (genre, year, folder structure) flagged for v2

**Playback:**
- Web Audio API for playback
- MediaSession API for lock screen controls (where supported)
- Play, pause, next, previous, seek, volume
- Queue management: add tracks, reorder, clear
- **Nothing auto-plays. Ever.** The user always initiates playback.

**Persistence:**
- Library index: OPFS (survives between sessions, all browsers)
- Playlists and preferences: OPFS
- Audio file caching: OPFS, **explicit opt-in only** — the user chooses what to cache

**Offline:**
- Service worker caches the app shell (HTML, CSS, JS)
- The player works without internet once the service worker is installed
- Audio plays from local files, not from cache (unless user explicitly cached tracks)

**User Alignment (Bodhi M1-M9 compliance):**
- M1 (Urgency): Nothing expires, no time pressure
- M2 (Obstructed Exit): Close the tab. That's it.
- M3 (Attention Capture): Nothing autoplays
- M4 (Consent Erosion): No data collection, nothing to consent to
- M5 (False Social Proof): No social features
- M6 (Cognitive Overload): Library, player, controls. That's it.
- M7 (Asymmetric Salience): One version, no tiers
- M8 (Anchoring): Free
- M9 (Enforced Continuity): No subscription, no account

---

## Testing and Verification

Each phase must have passing tests before moving to the next:

1. **Yantra/Mudrā definitions** — Test that every defined Yantra maps to valid HTML elements and every Mudrā maps to valid CSS properties.
2. **Compiler** — Test that YAML specs compile to correct HTML with proper attributes, classes, and ARIA roles. Test that the no-scroll constraint is enforced.
3. **Cetanā** — Test signal reactivity, computed auto-update, list diffing (insert/remove/reorder), component cleanup.
4. **Nāda** — The app loads, the folder picker works, metadata parses, the library renders, playback controls function, pagination works, the service worker installs.

Run `npm test --workspaces` after each phase. All tests must pass before committing.

---

## Commit Discipline

- One commit per meaningful unit of work (not per file)
- Commit messages describe *what changed and why*
- Never commit broken tests
- Never commit files containing secrets or API keys (there shouldn't be any — Nāda has no backend)

---

## TODO

Check off items as you complete them. This is your progress tracker across iterations.

```
PHASE 1 — DEFINITIONS
[ ] Create packages/compiler/package.json and register in root workspaces
[ ] Create packages/cetana/package.json and register in root workspaces
[ ] Create packages/nada/package.json and register in root workspaces
[ ] Define Yantra lookup table in packages/tokens/src/lookup/yantras.js
[ ] Define Mudrā lookup table in packages/tokens/src/lookup/mudras.js
[ ] Export yantras and mudras from packages/tokens/src/index.js
[ ] Write tests for Yantra → HTML mapping
[ ] Write tests for Mudrā → CSS mapping
[ ] All tests pass

PHASE 2 — COMPILER
[ ] Create compiler package structure (parser.js, emitters/, schema.js)
[ ] Implement YAML parser with validation against Yantra/Mudrā schema
[ ] Implement HTML emitter (Yantra → semantic HTML + data attributes + ARIA)
[ ] Implement CSS emitter (Mudrā → CSS classes referencing Bodhi tokens)
[ ] Implement JS emitter (bind/on properties → Cetanā integration)
[ ] Enforce no-scroll constraint on Garbha Yantra
[ ] Register `bodhi compile` CLI command
[ ] Write compiler tests (at least one test per Yantra, one per Mudrā)
[ ] Test compilation of a multi-component spec
[ ] All tests pass

PHASE 3 — CETANĀ
[ ] Implement signal.js (signal, subscribe, unsubscribe, batch updates)
[ ] Implement computed.js (derived signals with auto-update)
[ ] Implement list.js (keyed list diffing: insert, remove, reorder, update)
[ ] Implement component.js (mount/unmount lifecycle with cleanup)
[ ] Export public API from index.js
[ ] Write signal tests
[ ] Write computed tests
[ ] Write list diffing tests (insert, remove, reorder, mixed operations)
[ ] Write component lifecycle tests
[ ] All tests pass
[ ] Total module size is under 250 lines (excluding tests)

PHASE 4 — NĀDA
[ ] Create Nāda Bodhi YAML specs for app shell
[ ] Create specs for all views (artists, albums, album detail, queue, settings)
[ ] Compile specs using bodhi compile
[ ] Set up Nāda brand tokens (bodhi.rupa.json extending defaults)
[ ] Implement folder access using browser-fs-access
[ ] Implement metadata parsing with music-metadata in Web Worker
[ ] Implement OPFS caching for library index
[ ] Implement Cetanā signals for app state (currentTrack, isPlaying, queue, viewState)
[ ] Implement library views with Cetanā list rendering
[ ] Implement pagination (Bodhi no-scroll)
[ ] Implement playback controls (Web Audio API)
[ ] Implement MediaSession API integration
[ ] Implement folder bar (path display + select button)
[ ] Implement breadcrumb navigation (Artists → Artist → Album → Tracks)
[ ] Implement queue view
[ ] Implement settings view
[ ] Implement dark/light mode (prefers-color-scheme)
[ ] Write and register service worker
[ ] Manual testing: full user flow works end-to-end
[ ] Run ESLint with bodhi plugin — zero violations
[ ] All tests pass

PHASE 5 — POLISH
[ ] Keyboard accessibility audit (all interactive elements focusable, operable)
[ ] Screen reader testing (ARIA labels, live regions for now-playing updates)
[ ] Performance: library with 1000+ mock tracks renders without jank
[ ] Performance: pagination transitions feel instant
[ ] Verify zero telemetry (no network requests except service worker registration)
[ ] Build script produces deployable static site in dist/
[ ] README for Nāda with setup instructions
[ ] Update root Bodhi README to reference Nāda as first application
```

---

## Principles

When in doubt, apply these:

1. **User-aligned.** If a design decision could serve the developer's convenience at the user's expense, choose the user. This is Bodhi's core principle.
2. **Build what you need.** Don't define Yantras, Mudrās, or Cetanā features that nothing currently uses. They can be added when a real project needs them.
3. **Honest UI.** No loading spinners that lie. No fake progress bars. No auto-anything. The user initiates every action.
4. **No scroll.** Bodhi's no-scroll constraint is enforced. Content is paginated, not scrolled. This applies to every view in Nāda.
5. **Readable output.** A person should be able to view-source on the compiled HTML and understand what they're looking at. The Sanskrit class names should have enough context (via data attributes and comments) to be interpretable.
6. **Small.** Cetanā should be under 250 lines. The compiler should be simple enough that a developer can read it in an afternoon. Nāda's JS (excluding dependencies) should be small enough to audit by hand.
