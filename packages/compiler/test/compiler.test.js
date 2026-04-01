import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compile } from '../src/index.js';
import { emitHtml } from '../src/emitters/html.js';
import { emitCss } from '../src/emitters/css.js';
import { emitJs } from '../src/emitters/js.js';
import { validate } from '../src/schema.js';
import { parse } from '../src/parser.js';

// ── YAML Parsing ──────────────────────────────────────────────

describe('YAML Parser', () => {
  it('parses valid YAML into a spec', () => {
    const { spec, errors } = parse('yantra: Garbha\n');
    assert.equal(errors.length, 0);
    assert.equal(spec.yantra, 'Garbha');
  });

  it('returns errors for invalid YAML syntax', () => {
    const { errors } = parse(':::bad yaml');
    assert.ok(errors.length > 0);
  });

  it('returns errors for non-object YAML', () => {
    const { errors } = parse('- just\n- a list\n');
    assert.ok(errors.length > 0);
  });
});

// ── Schema Validation ─────────────────────────────────────────

describe('Schema Validation', () => {
  it('accepts a valid minimal spec', () => {
    assert.deepEqual(validate({ yantra: 'Garbha' }), []);
  });

  it('rejects missing yantra', () => {
    const errs = validate({ mudras: ['Stupa'] });
    assert.ok(errs.some(e => e.includes('missing required "yantra"')));
  });

  it('rejects unknown yantra', () => {
    const errs = validate({ yantra: 'FakeYantra' });
    assert.ok(errs.some(e => e.includes('unknown yantra')));
  });

  it('rejects unknown mudra', () => {
    const errs = validate({ yantra: 'Garbha', mudras: ['FakeMudra'] });
    assert.ok(errs.some(e => e.includes('unknown mudra')));
  });

  it('validates children recursively', () => {
    const errs = validate({
      yantra: 'Garbha',
      children: [{ yantra: 'Unknown' }],
    });
    assert.ok(errs.some(e => e.includes('children[0]') && e.includes('unknown yantra')));
  });

  it('validates views require id', () => {
    const errs = validate({
      yantra: 'Garbha',
      views: [{ yantra: 'Suci' }],
    });
    assert.ok(errs.some(e => e.includes('missing required "id"')));
  });
});

// ── HTML Emitter: One test per Yantra ─────────────────────────

describe('HTML Emitter — Yantra mapping', () => {
  const yantras = [
    { name: 'Suci', element: 'ul', class: 'suci' },
    { name: 'Kriya', element: 'button', class: 'kriya' },
    { name: 'Darsana', element: 'article', class: 'darsana' },
    { name: 'Vakya', element: 'p', class: 'vakya' },
    { name: 'Pravesa', element: 'input', class: 'pravesa' },
    { name: 'Pantha', element: 'nav', class: 'pantha' },
    { name: 'Sangraha', element: 'div', class: 'sangraha' },
    { name: 'Siras', element: 'header', class: 'siras' },
    { name: 'Pada', element: 'footer', class: 'pada' },
    { name: 'Garbha', element: 'main', class: 'garbha' },
    { name: 'Bindu', element: 'article', class: 'bindu' },
  ];

  for (const { name, element, class: cls } of yantras) {
    it(`${name} → <${element}> with class="${cls}"`, () => {
      const html = emitHtml({ yantra: name });
      assert.ok(html.includes(`<${element}`), `expected <${element}>`);
      assert.ok(html.includes(`class="${cls}"`), `expected class="${cls}"`);
      assert.ok(html.includes(`data-bodhi-yantra="${cls}"`));
    });
  }

  it('Pravesa (input) emits self-closing tag', () => {
    const html = emitHtml({ yantra: 'Pravesa' });
    assert.ok(html.includes('/>'));
    assert.ok(!html.includes('</input>'));
  });

  it('element override works', () => {
    const html = emitHtml({ yantra: 'Vakya', element: 'h1' });
    assert.ok(html.includes('<h1'));
  });
});

// ── HTML Emitter: ARIA roles ──────────────────────────────────

describe('HTML Emitter — ARIA roles', () => {
  it('Sangraha gets role="grid"', () => {
    const html = emitHtml({ yantra: 'Sangraha' });
    assert.ok(html.includes('role="grid"'));
  });

  it('Suci gets role="list"', () => {
    const html = emitHtml({ yantra: 'Suci' });
    assert.ok(html.includes('role="list"'));
  });

  it('nav element does not duplicate implicit navigation role', () => {
    const html = emitHtml({ yantra: 'Pantha' });
    // nav already implies navigation, should not add redundant role
    const roleMatches = html.match(/role="/g) || [];
    assert.ok(roleMatches.length <= 1);
  });
});

// ── HTML Emitter: data attributes and bindings ────────────────

describe('HTML Emitter — attributes and bindings', () => {
  it('emits data-bodhi-mudra for mudras', () => {
    const html = emitHtml({ yantra: 'Garbha', mudras: ['Stupa', 'Purna'] });
    assert.ok(html.includes('data-bodhi-mudra="stupa purna"'));
  });

  it('emits data-bodhi-component for named components', () => {
    const html = emitHtml({ yantra: 'Garbha', component: 'AppShell' });
    assert.ok(html.includes('data-bodhi-component="AppShell"'));
  });

  it('emits data-bodhi-bind for bound elements', () => {
    const html = emitHtml({ yantra: 'Vakya', bind: 'trackTitle' });
    assert.ok(html.includes('data-bodhi-bind="trackTitle"'));
  });

  it('emits data-bodhi-on-* for event handlers', () => {
    const html = emitHtml({ yantra: 'Kriya', on: { click: 'handlePlay' } });
    assert.ok(html.includes('data-bodhi-on-click="handlePlay"'));
  });

  it('emits content text', () => {
    const html = emitHtml({ yantra: 'Vakya', content: 'Hello World' });
    assert.ok(html.includes('Hello World'));
  });

  it('escapes HTML in content', () => {
    const html = emitHtml({ yantra: 'Vakya', content: '<script>xss</script>' });
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>'));
  });
});

// ── HTML Emitter: children and views ──────────────────────────

describe('HTML Emitter — hierarchy', () => {
  it('renders children nested inside parent', () => {
    const html = emitHtml({
      yantra: 'Garbha',
      children: [
        { yantra: 'Vakya', content: 'child text' },
      ],
    });
    assert.ok(html.includes('<main'));
    assert.ok(html.includes('<p'));
    assert.ok(html.includes('child text'));
  });

  it('renders views with data-bodhi-view attribute', () => {
    const html = emitHtml({
      yantra: 'Garbha',
      views: [
        { id: 'artists', yantra: 'Sangraha' },
      ],
    });
    assert.ok(html.includes('data-bodhi-view="artists"'));
  });
});

// ── CSS Emitter: One test per Mudra ───────────────────────────

describe('CSS Emitter — Mudra styles', () => {
  const mudras = [
    { name: 'Stupa', class: 'mudra-stupa', prop: 'flex-direction' },
    { name: 'Jala', class: 'mudra-jala', prop: 'display: grid' },
    { name: 'Sthira', class: 'mudra-sthira', prop: 'position: sticky' },
    { name: 'Cala', class: 'mudra-cala', prop: 'transition-property' },
    { name: 'Gupta', class: 'mudra-gupta' },
    { name: 'Purna', class: 'mudra-purna', prop: 'width: 100%' },
    { name: 'Samksipta', class: 'mudra-samksipta', prop: 'padding' },
  ];

  for (const { name, class: cls, prop } of mudras) {
    it(`${name} → .${cls}${prop ? ` with ${prop}` : ''}`, () => {
      const css = emitCss({ yantra: 'Garbha', mudras: [name] });
      assert.ok(css.includes(`.${cls}`), `expected .${cls}`);
      if (prop) assert.ok(css.includes(prop), `expected ${prop}`);
    });
  }
});

// ── CSS Emitter: No-scroll constraint ─────────────────────────

describe('CSS Emitter — No-scroll constraint', () => {
  it('enforces overflow: hidden on Garbha', () => {
    const css = emitCss({ yantra: 'Garbha' });
    assert.ok(css.includes('.garbha'));
    assert.ok(css.includes('overflow: hidden'));
  });

  it('does not enforce overflow: hidden on non-Garbha yantras', () => {
    const css = emitCss({ yantra: 'Siras' });
    assert.ok(!css.includes('overflow: hidden'));
  });
});

// ── CSS Emitter: Yantra base styles ───────────────────────────

describe('CSS Emitter — Yantra base styles', () => {
  it('generates base class for each used Yantra', () => {
    const css = emitCss({
      yantra: 'Garbha',
      children: [{ yantra: 'Siras' }, { yantra: 'Pada' }],
    });
    assert.ok(css.includes('.garbha'));
    assert.ok(css.includes('.siras'));
    assert.ok(css.includes('.pada'));
  });
});

// ── JS Emitter ────────────────────────────────────────────────

describe('JS Emitter', () => {
  it('returns empty string for static spec (no bind/on)', () => {
    const js = emitJs({ yantra: 'Garbha', children: [{ yantra: 'Vakya', content: 'hi' }] });
    assert.equal(js, '');
  });

  it('emits signal for bound values', () => {
    const js = emitJs({ yantra: 'Vakya', bind: 'trackTitle' });
    assert.ok(js.includes("import { signal"));
    assert.ok(js.includes('trackTitle = signal('));
  });

  it('emits event listener setup for on handlers', () => {
    const js = emitJs({ yantra: 'Kriya', on: { click: 'handlePlay' } });
    assert.ok(js.includes("addEventListener('click'"));
    assert.ok(js.includes('handlePlay'));
  });

  it('emits mount function named after component', () => {
    const js = emitJs({ yantra: 'Garbha', component: 'NadaShell', bind: 'x' });
    assert.ok(js.includes('initNadaShell'));
  });

  it('emits cleanup (removeEventListener) in unmount', () => {
    const js = emitJs({ yantra: 'Kriya', on: { click: 'fn' } });
    assert.ok(js.includes("removeEventListener('click'"));
  });
});

// ── Full compile() integration ────────────────────────────────

describe('compile() integration', () => {
  it('compiles a simple YAML spec to HTML + CSS', () => {
    const yaml = `
yantra: Garbha
mudras: [Stupa]
children:
  - yantra: Siras
    mudras: [Sthira, Purna]
    children:
      - yantra: Vakya
        element: span
        content: "Nada"
  - yantra: Pada
    mudras: [Sthira]
`;
    const result = compile(yaml);
    assert.equal(result.errors.length, 0);
    assert.ok(result.html.includes('<main'));
    assert.ok(result.html.includes('<header'));
    assert.ok(result.html.includes('<footer'));
    assert.ok(result.html.includes('Nada'));
    assert.ok(result.css.includes('.garbha'));
    assert.ok(result.css.includes('overflow: hidden'));
    assert.ok(result.css.includes('.mudra-stupa'));
  });

  it('compiles spec with bindings and events to HTML + CSS + JS', () => {
    const yaml = `
yantra: Garbha
component: TestApp
children:
  - yantra: Vakya
    bind: status
    content: "loading"
  - yantra: Kriya
    content: "Click me"
    on:
      click: handleClick
`;
    const result = compile(yaml);
    assert.equal(result.errors.length, 0);
    assert.ok(result.html.includes('data-bodhi-bind="status"'));
    assert.ok(result.js.includes('status = signal('));
    assert.ok(result.js.includes('initTestApp'));
    assert.ok(result.js.includes("addEventListener('click'"));
  });

  it('returns errors for invalid spec', () => {
    const result = compile('yantra: NonExistent\n');
    assert.ok(result.errors.length > 0);
    assert.equal(result.html, '');
  });

  it('respects --no-js option', () => {
    const yaml = 'yantra: Garbha\nbind: x\n';
    const result = compile(yaml, { js: false });
    assert.equal(result.js, '');
  });
});
