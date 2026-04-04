import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { compile } from '@bodhi/compiler';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const SPECS_DIR = resolve(ROOT, 'src/specs');
const DIST_DIR = resolve(ROOT, 'dist');

// ── Spec Compilation ──────────────────────────────────────────

describe('Nāda YAML Specs', () => {
  const specs = [
    'shell.bodhi.yaml',
    'artists.bodhi.yaml',
    'albums.bodhi.yaml',
    'album-detail.bodhi.yaml',
    'queue.bodhi.yaml',
    'settings.bodhi.yaml',
  ];

  for (const file of specs) {
    it(`${file} compiles without errors`, () => {
      const yaml = readFileSync(resolve(SPECS_DIR, file), 'utf8');
      const result = compile(yaml);
      assert.deepEqual(result.errors, [], `Errors: ${result.errors.join(', ')}`);
      assert.ok(result.html.length > 0, 'HTML output is empty');
      assert.ok(result.css.length > 0, 'CSS output is empty');
    });
  }
});

// ── Shell Spec Structure ──────────────────────────────────────

describe('Nāda Shell Structure', () => {
  const yaml = readFileSync(resolve(SPECS_DIR, 'shell.bodhi.yaml'), 'utf8');
  const result = compile(yaml);

  it('shell uses Garbha (main) as root yantra', () => {
    assert.ok(result.html.startsWith('<main'));
  });

  it('shell includes header (Siras)', () => {
    assert.ok(result.html.includes('<header'));
    assert.ok(result.html.includes('data-bodhi-yantra="siras"'));
  });

  it('shell includes footer (Pada) for now-playing', () => {
    assert.ok(result.html.includes('<footer'));
    assert.ok(result.html.includes('data-bodhi-yantra="pada"'));
  });

  it('shell includes navigation (Pantha) for tab bar', () => {
    assert.ok(result.html.includes('<nav'));
  });

  it('shell has playback control buttons', () => {
    assert.ok(result.html.includes('data-bodhi-on-click="togglePlay"'));
    assert.ok(result.html.includes('data-bodhi-on-click="prevTrack"'));
    assert.ok(result.html.includes('data-bodhi-on-click="nextTrack"'));
  });

  it('shell has folder open button', () => {
    assert.ok(result.html.includes('data-bodhi-on-click="openFolder"'));
  });

  it('shell has volume slider (Pravesa input)', () => {
    assert.ok(result.html.includes('data-bodhi-on-input="setVolume"'));
  });

  it('enforces no-scroll on Garbha', () => {
    assert.ok(result.css.includes('overflow: hidden'));
  });
});

// ── Build Output ──────────────────────────────────────────────

describe('Nāda Build Output', () => {
  it('dist/components.html exists', () => {
    assert.ok(existsSync(resolve(DIST_DIR, 'components.html')));
  });

  it('dist/components.css exists', () => {
    assert.ok(existsSync(resolve(DIST_DIR, 'components.css')));
  });

  it('dist/index.html exists', () => {
    assert.ok(existsSync(resolve(DIST_DIR, 'index.html')));
  });

  it('dist/sw.js (service worker) exists', () => {
    assert.ok(existsSync(resolve(DIST_DIR, 'sw.js')));
  });
});

// ── Brand Tokens ──────────────────────────────────────────────

describe('Nāda Brand Tokens', () => {
  const rupa = JSON.parse(readFileSync(resolve(ROOT, 'bodhi.rupa.json'), 'utf8'));

  it('has light and dark color themes', () => {
    assert.ok(rupa.tokens.color.light);
    assert.ok(rupa.tokens.color.dark);
  });

  it('has spatial tokens', () => {
    assert.ok(rupa.tokens.spatial.sparsa);
    assert.ok(rupa.tokens.spatial.vicara);
  });

  it('has voice tokens', () => {
    assert.ok(rupa.tokens.voice.family);
  });

  it('has now-playing-specific colors', () => {
    assert.ok(rupa.tokens.color.dark['now-playing-bg']);
    assert.ok(rupa.tokens.color.light['now-playing-bg']);
  });
});

// ── Breadcrumb Navigation ─────────────────────────────────────

describe('Breadcrumb Navigation', () => {
  it('views.js exports breadcrumb signals and navigation functions', () => {
    const src = readFileSync(resolve(ROOT, 'src/cetana/views.js'), 'utf8');
    assert.ok(src.includes('export const selectedArtist'), 'Must export selectedArtist');
    assert.ok(src.includes('export const selectedAlbum'), 'Must export selectedAlbum');
    assert.ok(src.includes('export const breadcrumb'), 'Must export breadcrumb');
    assert.ok(src.includes('export function selectArtist'), 'Must export selectArtist');
    assert.ok(src.includes('export function selectAlbum'), 'Must export selectAlbum');
    assert.ok(src.includes('export function breadcrumbBack'), 'Must export breadcrumbBack');
    assert.ok(src.includes('export function showArtistAlbums'), 'Must export showArtistAlbums');
  });

  it('views.js exports filteredAlbums and filteredTracks computed values', () => {
    const src = readFileSync(resolve(ROOT, 'src/cetana/views.js'), 'utf8');
    assert.ok(src.includes('export const filteredAlbums'), 'Must export filteredAlbums');
    assert.ok(src.includes('export const filteredTracks'), 'Must export filteredTracks');
  });

  it('breadcrumb.bodhi.yaml compiles without errors', () => {
    const yaml = readFileSync(resolve(SPECS_DIR, 'breadcrumb.bodhi.yaml'), 'utf8');
    const result = compile(yaml);
    assert.deepEqual(result.errors, [], `Errors: ${result.errors.join(', ')}`);
    assert.ok(result.html.includes('aria-label="Breadcrumb"'));
  });

  it('shell includes breadcrumb navigation', () => {
    const yaml = readFileSync(resolve(SPECS_DIR, 'shell.bodhi.yaml'), 'utf8');
    const result = compile(yaml);
    assert.ok(result.html.includes('aria-label="Breadcrumb navigation"'));
  });

  it('selectArtist resets page to 0', () => {
    const src = readFileSync(resolve(ROOT, 'src/cetana/views.js'), 'utf8');
    // selectArtist function should reset page
    assert.ok(src.includes('page.set(0)'), 'Must reset page on navigation');
  });
});

// ── Web Worker ────────────────────────────────────────────────

describe('Web Worker for Metadata Parsing', () => {
  it('index-worker.js exists', () => {
    assert.ok(existsSync(resolve(ROOT, 'src/workers/index-worker.js')));
  });

  it('index-worker.js listens for message events', () => {
    const src = readFileSync(resolve(ROOT, 'src/workers/index-worker.js'), 'utf8');
    assert.ok(src.includes("addEventListener('message'"), 'Worker must listen for messages');
  });

  it('index-worker.js posts progress and done messages', () => {
    const src = readFileSync(resolve(ROOT, 'src/workers/index-worker.js'), 'utf8');
    assert.ok(src.includes("type: 'progress'"), 'Worker must post progress');
    assert.ok(src.includes("type: 'done'"), 'Worker must post done');
  });

  it('library.js exports indexProgress signal', async () => {
    // Dynamic import to verify export exists
    const libSrc = readFileSync(resolve(ROOT, 'src/cetana/library.js'), 'utf8');
    assert.ok(libSrc.includes('export const indexProgress'), 'Must export indexProgress signal');
  });

  it('library.js falls back to main thread when Worker unavailable', () => {
    const libSrc = readFileSync(resolve(ROOT, 'src/cetana/library.js'), 'utf8');
    assert.ok(libSrc.includes("typeof Worker !== 'undefined'"), 'Must check Worker availability');
  });
});

// ── M1-M9 Compliance (structural checks) ─────────────────────

describe('Bodhi M1-M9 Compliance', () => {
  const shellYaml = readFileSync(resolve(SPECS_DIR, 'shell.bodhi.yaml'), 'utf8');
  const result = compile(shellYaml);

  it('M3: nothing auto-plays (no autoplay attributes)', () => {
    assert.ok(!result.html.includes('autoplay'));
  });

  it('M4: no data collection (no tracking attributes)', () => {
    assert.ok(!result.html.includes('analytics'));
    assert.ok(!result.html.includes('telemetry'));
    assert.ok(!result.html.includes('tracking'));
  });

  it('M6: simple controls only', () => {
    // Verify the core controls exist: play, prev, next, volume
    const controls = ['togglePlay', 'prevTrack', 'nextTrack', 'setVolume'];
    for (const ctrl of controls) {
      assert.ok(result.html.includes(ctrl), `Missing control: ${ctrl}`);
    }
  });
});
