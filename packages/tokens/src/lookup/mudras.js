/**
 * Bodhi Mudrā (मुद्रा) Lookup Table
 *
 * Mudrās are gesture qualities — behavioral CSS modifiers applied to Yantras.
 * Each Mudrā maps to CSS properties that alter how a Yantra presents itself.
 *
 * Resolution path:
 *   Mudrā name → Lookup table → CSS declarations
 *
 * Only Mudrās that Nāda needs are defined here.
 * New Mudrās are added when a real project requires them.
 */

export const mudras = {
  stupa: {
    sanskrit: 'Stūpa',
    devanagari: 'स्तूप',
    quality: 'Stacking — vertical layout, elements piled atop one another',
    css: {
      display: 'flex',
      'flex-direction': 'column',
    },
    className: 'mudra-stupa',
  },
  jala: {
    sanskrit: 'Jāla',
    devanagari: 'जाल',
    quality: 'Grid/network — items arranged in a two-dimensional lattice',
    css: {
      display: 'grid',
      'grid-template-columns': 'repeat(auto-fill, minmax(var(--bodhi-grid-min, 12rem), 1fr))',
      gap: 'var(--bodhi-akasa-vicara, 1rem)',
    },
    className: 'mudra-jala',
  },
  sthira: {
    sanskrit: 'Sthira',
    devanagari: 'स्थिर',
    quality: 'Fixed/sticky — anchored in the viewport, does not move with content',
    css: {
      position: 'sticky',
      'z-index': '10',
    },
    className: 'mudra-sthira',
  },
  cala: {
    sanskrit: 'Cala',
    devanagari: 'चल',
    quality: 'Motion/transition — smooth state changes',
    css: {
      'transition-property': 'opacity, transform',
      'transition-duration': '200ms',
      'transition-timing-function': 'ease-in-out',
    },
    className: 'mudra-cala',
  },
  gupta: {
    sanskrit: 'Gupta',
    devanagari: 'गुप्त',
    quality: 'Hidden/revealed — content that can be toggled visible or invisible',
    css: {},
    className: 'mudra-gupta',
  },
  purna: {
    sanskrit: 'Pūrṇa',
    devanagari: 'पूर्ण',
    quality: 'Full-width — stretches to fill available horizontal space',
    css: {
      width: '100%',
    },
    className: 'mudra-purna',
  },
  samksipta: {
    sanskrit: 'Saṃkṣipta',
    devanagari: 'संक्षिप्त',
    quality: 'Compact/dense — reduced spacing for information-dense layouts',
    css: {
      padding: 'var(--bodhi-akasa-sparsa, 0.125rem)',
      gap: 'var(--bodhi-akasa-svasa, 0.5rem)',
    },
    className: 'mudra-samksipta',
  },
};

/**
 * Resolve a Mudrā name to its definition.
 *
 * @param {string} name — e.g., 'stupa', 'jala', 'sthira'
 * @returns {object} The Mudrā definition
 */
export function resolveMudra(name) {
  const key = name.toLowerCase()
    .replace(/[āīūṛṝḷḹśṣṇṅṃḥ]/g, match => {
      const map = { 'ā': 'a', 'ī': 'i', 'ū': 'u', 'ṛ': 'r', 'ṝ': 'r', 'ḷ': 'l', 'ḹ': 'l', 'ś': 's', 'ṣ': 's', 'ṇ': 'n', 'ṅ': 'n', 'ṃ': 'm', 'ḥ': 'h' };
      return map[match] || match;
    })
    .replace(/[^a-z]/g, '');
  const mudra = mudras[key];
  if (!mudra) {
    throw new Error(
      `Unknown Bodhi Mudrā: "${name}". ` +
      `Available Mudrās: ${Object.keys(mudras).join(', ')}`,
    );
  }
  return mudra;
}

/**
 * Get all Mudrā definitions.
 */
export function getAllMudras() {
  return { ...mudras };
}

export default mudras;
