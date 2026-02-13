/**
 * eslint-plugin-bodhi
 *
 * Design ethics enforcement for the web.
 * Nine markers. Three layers. One question:
 * Does this interface serve the user?
 *
 * @see https://github.com/yourusername/bodhi
 */

import noManufacturedUrgency from './rules/no-manufactured-urgency.js';
import noObstructedExit from './rules/no-obstructed-exit.js';
import noAttentionCapture from './rules/no-attention-capture.js';
import noConsentErosion from './rules/no-consent-erosion.js';
import noFalseSocialProof from './rules/no-false-social-proof.js';
import noCognitiveOverload from './rules/no-cognitive-overload.js';
import noAsymmetricSalience from './rules/no-asymmetric-salience.js';
import noAnchoringManipulation from './rules/no-anchoring-manipulation.js';
import noEnforcedContinuity from './rules/no-enforced-continuity.js';

// ─── Rule Registry ────────────────────────────────────────────
// All nine markers of the Bodhi design ethics framework.

const rules = {
  'no-manufactured-urgency': noManufacturedUrgency,     // M1
  'no-obstructed-exit': noObstructedExit,                // M2
  'no-attention-capture': noAttentionCapture,            // M3
  'no-consent-erosion': noConsentErosion,                // M4
  'no-false-social-proof': noFalseSocialProof,           // M5
  'no-cognitive-overload': noCognitiveOverload,          // M6
  'no-asymmetric-salience': noAsymmetricSalience,        // M7
  'no-anchoring-manipulation': noAnchoringManipulation,  // M8
  'no-enforced-continuity': noEnforcedContinuity,        // M9
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
      'bodhi/no-manufactured-urgency': ['warn', { mode: 'lenient', interfaceMode: 'poetic' }],
      'bodhi/no-obstructed-exit': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-attention-capture': ['warn', { mode: 'lenient', interfaceMode: 'poetic' }],
      'bodhi/no-consent-erosion': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-false-social-proof': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-cognitive-overload': ['warn', { mode: 'lenient', interfaceMode: 'poetic' }],
      'bodhi/no-asymmetric-salience': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-anchoring-manipulation': ['warn', { mode: 'lenient', interfaceMode: 'poetic' }],
      'bodhi/no-enforced-continuity': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
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
      'bodhi/no-manufactured-urgency': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-obstructed-exit': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-attention-capture': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-consent-erosion': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-false-social-proof': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-cognitive-overload': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-asymmetric-salience': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-anchoring-manipulation': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
      'bodhi/no-enforced-continuity': ['warn', { mode: 'lenient', interfaceMode: 'semantic' }],
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
      'bodhi/no-manufactured-urgency': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-obstructed-exit': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-attention-capture': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-consent-erosion': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-false-social-proof': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-cognitive-overload': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-asymmetric-salience': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-anchoring-manipulation': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
      'bodhi/no-enforced-continuity': ['warn', { mode: 'lenient', interfaceMode: 'raw' }],
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
