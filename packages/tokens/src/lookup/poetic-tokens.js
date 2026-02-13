/**
 * Bodhi Poetic Token Lookup Tables
 *
 * Poetic tokens are handles pointing to brand-specific values.
 * Like HTML named colors: "chartreuse" → #7FFF00 regardless of context.
 * "vicāra" → 1rem in one brand, 1.5rem in another.
 *
 * Resolution path:
 *   Poetic token → Lookup table (brand-specific) → CSS value
 *
 * Three categories:
 *   1. Spatial Intent (Ākāśa) — how much room something needs
 *   2. Communicative Acts (Varṇa) — what color communicates
 *   3. Voices (Lipi) — how text speaks
 *
 * This is the DEFAULT lookup table. Brands override these values
 * in their Rūpa files. The framework works without AI — a developer
 * writing `vicāra` gets a deterministic value from this table.
 */

// ─── Spatial Intent (Ākāśa) ──────────────────────────────────
// How much breathing room does this element need?

export const spatialTokens = {
  sparsa: {
    sanskrit: 'sparśa',
    devanagari: 'स्पर्श',
    intent: 'Touch — intimate contact, deliberately close',
    markerIntegration: 'At decision points: potential M6 (cognitive overload)',
    defaultValue: '0.125rem',
    cssProperty: '--bodhi-akasa-sparsa',
  },
  svasa: {
    sanskrit: 'śvāsa',
    devanagari: 'श्वास',
    intent: 'Breath — just enough room to exist separately',
    markerIntegration: 'Default micro-spacing',
    defaultValue: '0.5rem',
    cssProperty: '--bodhi-akasa-svasa',
  },
  vicara: {
    sanskrit: 'vicāra',
    devanagari: 'विचार',
    intent: 'Contemplation — space inviting the mind to process',
    markerIntegration: 'At checkout: supports decision quality',
    defaultValue: '1rem',
    cssProperty: '--bodhi-akasa-vicara',
  },
  vistara: {
    sanskrit: 'vistāra',
    devanagari: 'विस्तार',
    intent: 'Expanse — deliberate openness for decision to form',
    markerIntegration: 'After urgency cues: counteracts M1',
    defaultValue: '2rem',
    cssProperty: '--bodhi-akasa-vistara',
  },
};

// ─── Communicative Acts (Varṇa) ──────────────────────────────
// What is this color saying to the user?

export const communicativeTokens = {
  ahvana: {
    sanskrit: 'āhvāna',
    devanagari: 'आह्वान',
    intent: 'Invitation — invites action without demanding it',
    markerIntegration: 'On cancel: potential M7 (if asymmetric with confirm)',
    defaultValue: 'var(--bodhi-varna-primary)',
    cssProperty: '--bodhi-varna-ahvana',
  },
  raksa: {
    sanskrit: 'rakṣā',
    devanagari: 'रक्षा',
    intent: 'Protection — warns, guards, prevents',
    markerIntegration: 'On irreversible actions: appropriate',
    defaultValue: 'var(--bodhi-varna-danger)',
    cssProperty: '--bodhi-varna-raksa',
  },
  sthiti: {
    sanskrit: 'sthiti',
    devanagari: 'स्थिति',
    intent: 'Steadiness — grounds, stabilizes, recedes',
    markerIntegration: 'Default surface color',
    defaultValue: 'var(--bodhi-varna-surface)',
    cssProperty: '--bodhi-varna-sthiti',
  },
  ullasa: {
    sanskrit: 'ullāsa',
    devanagari: 'उल्लास',
    intent: 'Delight — celebrates, rewards, affirms',
    markerIntegration: 'Post-action confirmation',
    defaultValue: 'var(--bodhi-varna-success)',
    cssProperty: '--bodhi-varna-ullasa',
  },
};

// ─── Voices (Lipi) ───────────────────────────────────────────
// How loud is this text? What register does it speak in?

export const voiceTokens = {
  japa: {
    sanskrit: 'japa',
    devanagari: 'जप',
    intent: 'Murmur — fine print, supporting detail',
    markerIntegration: 'Marketing text + japa for terms: potential M4',
    defaultValue: '0.75rem',
    cssProperty: '--bodhi-lipi-japa',
  },
  katha: {
    sanskrit: 'kathā',
    devanagari: 'कथा',
    intent: 'Storytelling — body text, natural voice',
    markerIntegration: 'Default content voice',
    defaultValue: '1rem',
    cssProperty: '--bodhi-lipi-katha',
  },
  ghosana: {
    sanskrit: 'ghoṣaṇā',
    devanagari: 'घोषणा',
    intent: 'Proclamation — headings, carrying voice',
    markerIntegration: 'Terms text + ghoṣaṇā for marketing: reversed M4',
    defaultValue: '1.5rem',
    cssProperty: '--bodhi-lipi-ghosana',
  },
};

// ─── Lookup Function ─────────────────────────────────────────

const ALL_TOKENS = {
  ...spatialTokens,
  ...communicativeTokens,
  ...voiceTokens,
};

/**
 * Resolve a poetic token name to its default CSS value.
 *
 * @param {string} tokenName — e.g., 'vicara', 'ahvana', 'katha'
 * @param {object} brandOverrides — optional brand-specific values
 * @returns {string} The resolved CSS value
 */
export function resolveToken(tokenName, brandOverrides = {}) {
  const token = ALL_TOKENS[tokenName];
  if (!token) {
    throw new Error(
      `Unknown Bodhi token: "${tokenName}". ` +
      `Available tokens: ${Object.keys(ALL_TOKENS).join(', ')}`,
    );
  }

  // Brand override takes precedence
  if (brandOverrides[tokenName] !== undefined) {
    return brandOverrides[tokenName];
  }

  return token.defaultValue;
}

/**
 * Get all token metadata (for documentation, tooling, etc.)
 */
export function getAllTokens() {
  return { ...ALL_TOKENS };
}

export default ALL_TOKENS;
