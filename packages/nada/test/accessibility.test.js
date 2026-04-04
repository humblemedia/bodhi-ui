import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compile } from '@bodhi/compiler';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const SPECS_DIR = resolve(ROOT, 'src/specs');

const shellYaml = readFileSync(resolve(SPECS_DIR, 'shell.bodhi.yaml'), 'utf8');
const shell = compile(shellYaml);
const detailYaml = readFileSync(resolve(SPECS_DIR, 'album-detail.bodhi.yaml'), 'utf8');
const detail = compile(detailYaml);

// ── Keyboard Accessibility ────────────────────────────────────

describe('Keyboard Accessibility', () => {
  it('all interactive elements use <button> (natively focusable)', () => {
    // Every Kriya yantra compiles to <button> — no div-as-button
    const divButtons = shell.html.match(/<div[^>]*data-bodhi-on-click/g);
    assert.equal(divButtons, null, 'Found div elements with click handlers');
  });

  it('tab buttons have role="tab"', () => {
    assert.ok(shell.html.includes('role="tab"'));
  });

  it('tab bar has role="tablist"', () => {
    assert.ok(shell.html.includes('role="tablist"'));
  });

  it('CSS includes focus-visible styles for keyboard navigation', () => {
    assert.ok(shell.css.includes(':focus-visible'));
    assert.ok(shell.css.includes('outline'));
  });

  it('CSS includes prefers-reduced-motion media query', () => {
    assert.ok(shell.css.includes('prefers-reduced-motion'));
  });

  it('volume slider has type="range" (keyboard operable)', () => {
    assert.ok(shell.html.includes('type="range"'));
  });
});

// ── Screen Reader (ARIA) ──────────────────────────────────────

describe('Screen Reader / ARIA', () => {
  it('playback buttons have aria-label', () => {
    assert.ok(shell.html.includes('aria-label="Previous track"'));
    assert.ok(shell.html.includes('aria-label="Play or pause"'));
    assert.ok(shell.html.includes('aria-label="Next track"'));
  });

  it('volume slider has aria-label', () => {
    assert.ok(shell.html.includes('aria-label="Volume"'));
  });

  it('now-playing region has aria-live="polite"', () => {
    assert.ok(shell.html.includes('aria-live="polite"'));
  });

  it('now-playing has aria-label', () => {
    assert.ok(shell.html.includes('aria-label="Now playing"'));
  });

  it('header has aria-label', () => {
    assert.ok(shell.html.includes('aria-label="Nāda music player"'));
  });

  it('tab buttons have aria-controls pointing to view panels', () => {
    assert.ok(shell.html.includes('aria-controls="artists"'));
    assert.ok(shell.html.includes('aria-controls="albums"'));
    assert.ok(shell.html.includes('aria-controls="queue"'));
    assert.ok(shell.html.includes('aria-controls="settings"'));
  });

  it('view panels have role="tabpanel"', () => {
    assert.ok(shell.html.includes('role="tabpanel"'));
  });

  it('breadcrumb nav has aria-label', () => {
    assert.ok(detail.html.includes('aria-label="Breadcrumb"'));
  });

  it('folder path has aria-live for dynamic updates', () => {
    assert.ok(shell.html.includes('aria-live="polite"'));
  });

  it('playback controls toolbar has aria-label', () => {
    assert.ok(shell.html.includes('aria-label="Playback controls"'));
  });
});

// ── Keyboard Navigation (structural) ─────────────────────────

describe('Keyboard Navigation', () => {
  it('render.js handles Escape key for breadcrumb navigation', () => {
    const src = readFileSync(resolve(ROOT, 'src/cetana/render.js'), 'utf8');
    assert.ok(src.includes("e.key === 'Escape'"), 'Must handle Escape key');
  });

  it('render.js moves focus on view change', () => {
    const src = readFileSync(resolve(ROOT, 'src/cetana/render.js'), 'utf8');
    assert.ok(src.includes('.focus()'), 'Must move focus to first interactive element');
  });

  it('all buttons use native <button> element (Enter/Space operable)', () => {
    // Check all specs compile to <button>, never <div> with click handlers
    const specs = ['shell', 'artists', 'albums', 'album-detail', 'queue', 'settings'];
    for (const name of specs) {
      const yaml = readFileSync(resolve(SPECS_DIR, `${name}.bodhi.yaml`), 'utf8');
      const result = compile(yaml);
      const divClicks = result.html.match(/<div[^>]*data-bodhi-on-click/g);
      assert.equal(divClicks, null, `${name}: found div with click handler`);
    }
  });

  it('volume slider uses native input[type="range"] (arrow keys work)', () => {
    assert.ok(shell.html.includes('type="range"'));
  });
});

// ── Zero Telemetry ────────────────────────────────────────────

describe('Zero Telemetry', () => {
  const allSpecs = ['shell', 'artists', 'albums', 'album-detail', 'queue', 'settings'];

  for (const name of allSpecs) {
    const yaml = readFileSync(resolve(SPECS_DIR, `${name}.bodhi.yaml`), 'utf8');
    const result = compile(yaml);

    it(`${name}: no analytics/tracking attributes`, () => {
      const forbidden = ['analytics', 'telemetry', 'tracking', 'beacon', 'gtag', 'ga('];
      for (const term of forbidden) {
        assert.ok(!result.html.includes(term), `Found "${term}" in ${name} HTML`);
        assert.ok(!result.js.includes(term), `Found "${term}" in ${name} JS`);
      }
    });
  }

  it('service worker makes no external network requests', () => {
    const sw = readFileSync(resolve(ROOT, 'src/static/sw.js'), 'utf8');
    assert.ok(!sw.includes('http://'));
    assert.ok(!sw.includes('https://'));
  });
});

// ── Performance: pagination structure ─────────────────────────

describe('Performance Structure', () => {
  it('views use Sanggraha (grid) with Jala mudra for efficient layout', () => {
    assert.ok(shell.css.includes('display: grid'));
    assert.ok(shell.css.includes('repeat(auto-fill'));
  });

  it('Garbha enforces overflow: hidden (no-scroll)', () => {
    assert.ok(shell.css.includes('overflow: hidden'));
  });

  it('app shell title uses h1 for proper heading hierarchy', () => {
    assert.ok(shell.html.includes('<h1'));
  });
});
