import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mudras, resolveMudra, getAllMudras } from '../src/lookup/mudras.js';

// CSS properties that are valid for layout/visual Mudrā effects
const VALID_CSS_PROPERTIES = new Set([
  'display', 'flex-direction', 'grid-template-columns', 'gap',
  'position', 'z-index', 'transition-property', 'transition-duration',
  'transition-timing-function', 'width', 'padding', 'overflow',
  'visibility', 'opacity', 'top', 'bottom', 'left', 'right',
]);

describe('Mudrā Lookup Table', () => {
  it('defines all 7 Nāda-required Mudrās', () => {
    const expected = [
      'stupa', 'jala', 'sthira', 'cala', 'gupta', 'purna', 'samksipta',
    ];
    for (const name of expected) {
      assert.ok(mudras[name], `Missing Mudrā: ${name}`);
    }
  });

  it('every Mudrā has Sanskrit name, Devanagari, quality, and className', () => {
    for (const [name, mudra] of Object.entries(mudras)) {
      assert.ok(mudra.sanskrit, `Mudrā "${name}" missing Sanskrit name`);
      assert.ok(mudra.devanagari, `Mudrā "${name}" missing Devanagari`);
      assert.ok(mudra.quality, `Mudrā "${name}" missing quality`);
      assert.ok(mudra.className, `Mudrā "${name}" missing className`);
    }
  });

  it('every Mudrā css property is a valid CSS property', () => {
    for (const [name, mudra] of Object.entries(mudras)) {
      for (const prop of Object.keys(mudra.css)) {
        assert.ok(
          VALID_CSS_PROPERTIES.has(prop),
          `Mudrā "${name}" has invalid CSS property "${prop}"`,
        );
      }
    }
  });

  it('every Mudrā css value is a non-empty string', () => {
    for (const [name, mudra] of Object.entries(mudras)) {
      for (const [prop, value] of Object.entries(mudra.css)) {
        assert.equal(typeof value, 'string', `Mudrā "${name}" CSS "${prop}" is not a string`);
        assert.ok(value.length > 0, `Mudrā "${name}" CSS "${prop}" is empty`);
      }
    }
  });

  it('specific Mudrā → CSS mappings are correct', () => {
    assert.equal(mudras.stupa.css['flex-direction'], 'column');
    assert.equal(mudras.jala.css.display, 'grid');
    assert.equal(mudras.sthira.css.position, 'sticky');
    assert.ok(mudras.cala.css['transition-duration']);
    assert.equal(mudras.purna.css.width, '100%');
    assert.ok(mudras.samksipta.css.padding);
  });

  it('Mudrā className follows mudra-{name} pattern', () => {
    for (const [name, mudra] of Object.entries(mudras)) {
      assert.ok(
        mudra.className.startsWith('mudra-'),
        `Mudrā "${name}" className "${mudra.className}" does not start with "mudra-"`,
      );
    }
  });

  it('resolveMudra resolves by lowercase key', () => {
    const stupa = resolveMudra('stupa');
    assert.equal(stupa.css['flex-direction'], 'column');
  });

  it('resolveMudra handles diacritics in input', () => {
    const stupa = resolveMudra('Stūpa');
    assert.equal(stupa.className, 'mudra-stupa');
  });

  it('resolveMudra throws for unknown Mudrā', () => {
    assert.throws(() => resolveMudra('nonexistent'), /Unknown Bodhi Mudrā/);
  });

  it('getAllMudras returns a copy of all definitions', () => {
    const all = getAllMudras();
    assert.equal(Object.keys(all).length, 7);
    all.stupa = null;
    assert.ok(mudras.stupa);
  });
});
