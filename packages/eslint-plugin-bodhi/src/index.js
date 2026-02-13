/**
 * eslint-plugin-bodhi
 *
 * Design ethics enforcement for the web.
 * Nine markers. Three layers. One question:
 * Does this interface serve the user?
 *
 * @see https://github.com/yourusername/bodhi
 */

import noConsentErosion from './rules/no-consent-erosion.js';
import noObstructedExit from './rules/no-obstructed-exit.js';
import noAsymmetricSalience from './rules/no-asymmetric-salience.js';

// ─── Rule Registry ────────────────────────────────────────────
// Proto-Bodhi ships with three rules (M2, M4, M7).
// Remaining six will be added as detection logic matures.

const rules = {
  'no-consent-erosion': noConsentErosion,             // M4
  'no-obstructed-exit': noObstructedExit,             // M2
  'no-asymmetric-salience': noAsymmetricSalience,     // M7
  // 'no-manufactured-urgency': placeholder,           // M1 — planned
  // 'no-attention-capture': placeholder,              // M3 — planned
  // 'no-false-social-proof': placeholder,             // M5 — planned
  // 'no-cognitive-overload': placeholder,             // M6 — planned
  // 'no-anchoring-manipulation': placeholder,         // M8 — planned
  // 'no-enforced-continuity': placeholder,            // M9 — planned
};

// ─── Shared Configs ───────────────────────────────────────────

const configs = {
  /**
   * Recommended config — dogmatic mode on consent-critical rules,
   * lenient on heuristic-heavy rules. Poetic interface mode.
   */
  recommended: {
    plugins: {
      bodhi: { rules },
    },
    rules: {
      'bodhi/no-consent-erosion': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-obstructed-exit': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-asymmetric-salience': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
    },
  },

  /**
   * Lenient config — flags for review instead of blocking.
   * Good for migrating existing projects.
   */
  lenient: {
    plugins: {
      bodhi: { rules },
    },
    rules: {
      'bodhi/no-consent-erosion': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-obstructed-exit': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-asymmetric-salience': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
    },
  },

  /**
   * Raw config — standard ESLint messages, no philosophy.
   * Migration path from conventional linting.
   */
  raw: {
    plugins: {
      bodhi: { rules },
    },
    rules: {
      'bodhi/no-consent-erosion': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-obstructed-exit': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-asymmetric-salience': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
    },
  },
};

// ─── Plugin Export ────────────────────────────────────────────

const plugin = {
  meta: {
    name: 'eslint-plugin-bodhi',
    version: '0.1.0',
  },
  rules,
  configs,
};

export default plugin;
