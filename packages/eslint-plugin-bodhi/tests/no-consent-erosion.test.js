/**
 * Tests for bodhi/no-consent-erosion (M4)
 *
 * Run with: node --test packages/eslint-plugin-bodhi/tests/no-consent-erosion.test.js
 *
 * Note: These tests use the Node.js built-in test runner (Node 18+)
 * and ESLint's RuleTester. No external test framework needed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// For proper testing, we'd use ESLint's RuleTester:
//
// import { RuleTester } from 'eslint';
// import rule from '../src/rules/no-consent-erosion.js';
//
// const ruleTester = new RuleTester({
//   languageOptions: {
//     parserOptions: {
//       ecmaFeatures: { jsx: true },
//       ecmaVersion: 2022,
//       sourceType: 'module',
//     },
//   },
// });
//
// ruleTester.run('no-consent-erosion', rule, {
//   valid: [
//     // Unchecked checkbox — user makes affirmative choice
//     '<input type="checkbox" name="consent" />',
//
//     // Non-consent checkbox that's pre-checked (lenient mode)
//     {
//       code: '<input type="checkbox" name="remember-me" defaultChecked />',
//       options: [{ mode: 'lenient' }],
//     },
//
//     // Justified pre-check (lenient mode with escape hatch)
//     {
//       code: '<input type="checkbox" name="newsletter-consent" defaultChecked data-bodhi-justify="user previously opted in" />',
//       options: [{ mode: 'lenient' }],
//     },
//   ],
//
//   invalid: [
//     // Pre-checked consent checkbox
//     {
//       code: '<input type="checkbox" name="newsletter-consent" defaultChecked />',
//       errors: [{ messageId: 'preCheckedConsent' }],
//     },
//
//     // Pre-checked with explicit true
//     {
//       code: '<input type="checkbox" name="tracking-consent" defaultChecked={true} />',
//       errors: [{ messageId: 'preCheckedConsent' }],
//     },
//
//     // Dogmatic mode catches ALL pre-checked checkboxes
//     {
//       code: '<input type="checkbox" name="some-option" defaultChecked />',
//       options: [{ mode: 'dogmatic' }],
//       errors: [{ messageId: 'preCheckedGeneral' }],
//     },
//   ],
// });

// Placeholder smoke test until ESLint RuleTester is wired up
describe('no-consent-erosion', () => {
  it('rule module exports correctly', async () => {
    const { default: rule } = await import('../src/rules/no-consent-erosion.js');
    assert.ok(rule.meta, 'Rule should have meta property');
    assert.ok(rule.create, 'Rule should have create function');
    assert.strictEqual(typeof rule.create, 'function');
    assert.ok(rule.meta.messages.preCheckedConsent, 'Should have preCheckedConsent message');
    assert.ok(rule.meta.messages.preCheckedGeneral, 'Should have preCheckedGeneral message');
  });

  it('koans load correctly for all modes', async () => {
    const { getKoan } = await import('../src/koans.js');
    const poetic = getKoan('no-consent-erosion', 'poetic');
    const semantic = getKoan('no-consent-erosion', 'semantic');
    const raw = getKoan('no-consent-erosion', 'raw');

    assert.ok(poetic.koan, 'Poetic mode should have a koan');
    assert.ok(poetic.explanation, 'Poetic mode should have an explanation');
    assert.ok(semantic.message, 'Semantic mode should have a message');
    assert.ok(raw.message, 'Raw mode should have a message');
  });
});

console.log('Tests loaded. Run with: node --test packages/eslint-plugin-bodhi/tests/no-consent-erosion.test.js');
