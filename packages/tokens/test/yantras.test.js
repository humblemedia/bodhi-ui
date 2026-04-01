import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { yantras, resolveYantra, getAllYantras } from '../src/lookup/yantras.js';

// Valid HTML elements for validation
const VALID_HTML_ELEMENTS = new Set([
  'div', 'span', 'p', 'a', 'button', 'input', 'textarea', 'select',
  'ul', 'ol', 'li', 'nav', 'header', 'footer', 'main', 'section',
  'article', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'form', 'label', 'fieldset', 'legend', 'table', 'img', 'figure',
]);

const VALID_ARIA_ROLES = new Set([
  'list', 'button', 'navigation', 'grid', 'banner', 'contentinfo',
  'main', 'complementary', 'search', 'form', 'region', 'alert',
  'dialog', 'tablist', 'tab', 'tabpanel', 'listbox', 'option',
  null, // null means no explicit role needed
]);

describe('Yantra Lookup Table', () => {
  it('defines all 11 Nāda-required Yantras', () => {
    const expected = [
      'suci', 'kriya', 'darsana', 'vakya', 'pravesa',
      'pantha', 'sangraha', 'siras', 'pada', 'garbha', 'bindu',
    ];
    for (const name of expected) {
      assert.ok(yantras[name], `Missing Yantra: ${name}`);
    }
  });

  it('every Yantra maps to a valid HTML element', () => {
    for (const [name, yantra] of Object.entries(yantras)) {
      assert.ok(
        VALID_HTML_ELEMENTS.has(yantra.element),
        `Yantra "${name}" maps to invalid element "${yantra.element}"`,
      );
    }
  });

  it('every Yantra alternate element is valid HTML', () => {
    for (const [name, yantra] of Object.entries(yantras)) {
      for (const alt of yantra.alternateElements) {
        assert.ok(
          VALID_HTML_ELEMENTS.has(alt),
          `Yantra "${name}" has invalid alternate element "${alt}"`,
        );
      }
    }
  });

  it('every Yantra has a valid ARIA role or null', () => {
    for (const [name, yantra] of Object.entries(yantras)) {
      assert.ok(
        VALID_ARIA_ROLES.has(yantra.role),
        `Yantra "${name}" has invalid ARIA role "${yantra.role}"`,
      );
    }
  });

  it('every Yantra has Sanskrit name, Devanagari, purpose, and className', () => {
    for (const [name, yantra] of Object.entries(yantras)) {
      assert.ok(yantra.sanskrit, `Yantra "${name}" missing Sanskrit name`);
      assert.ok(yantra.devanagari, `Yantra "${name}" missing Devanagari`);
      assert.ok(yantra.purpose, `Yantra "${name}" missing purpose`);
      assert.ok(yantra.className, `Yantra "${name}" missing className`);
    }
  });

  it('specific Yantra → HTML mappings are correct', () => {
    assert.equal(yantras.suci.element, 'ul');
    assert.equal(yantras.kriya.element, 'button');
    assert.equal(yantras.darsana.element, 'article');
    assert.equal(yantras.vakya.element, 'p');
    assert.equal(yantras.pravesa.element, 'input');
    assert.equal(yantras.pantha.element, 'nav');
    assert.equal(yantras.sangraha.element, 'div');
    assert.equal(yantras.siras.element, 'header');
    assert.equal(yantras.pada.element, 'footer');
    assert.equal(yantras.garbha.element, 'main');
    assert.equal(yantras.bindu.element, 'article');
  });

  it('resolveYantra resolves by lowercase key', () => {
    const garbha = resolveYantra('garbha');
    assert.equal(garbha.element, 'main');
    assert.equal(garbha.role, 'main');
  });

  it('resolveYantra throws for unknown Yantra', () => {
    assert.throws(() => resolveYantra('nonexistent'), /Unknown Bodhi Yantra/);
  });

  it('getAllYantras returns a copy of all definitions', () => {
    const all = getAllYantras();
    assert.equal(Object.keys(all).length, 11);
    // Mutating the copy does not affect the original
    all.suci = null;
    assert.ok(yantras.suci);
  });
});
