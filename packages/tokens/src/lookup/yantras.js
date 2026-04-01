/**
 * Bodhi Yantra (यन्त्र) Lookup Table
 *
 * Yantras are semantic UI constructs — instruments that serve a purpose.
 * Each Yantra maps to one or more HTML elements, carries an ARIA role,
 * and defines the semantic meaning of a UI region.
 *
 * Resolution path:
 *   Yantra name → Lookup table → HTML element + attributes
 *
 * Only Yantras that Nāda (or obvious universal patterns) need are defined.
 * New Yantras are added when a real project requires them.
 */

export const yantras = {
  suci: {
    sanskrit: 'Sūci',
    devanagari: 'सूचि',
    purpose: 'List/sequence — ordered or unordered collections of items',
    element: 'ul',
    alternateElements: ['ol'],
    role: 'list',
    defaultAttributes: {},
    className: 'suci',
  },
  kriya: {
    sanskrit: 'Kriyā',
    devanagari: 'क्रिया',
    purpose: 'Action/trigger — a user-initiated action',
    element: 'button',
    alternateElements: [],
    role: 'button',
    defaultAttributes: { type: 'button' },
    className: 'kriya',
  },
  darsana: {
    sanskrit: 'Darśana',
    devanagari: 'दर्शन',
    purpose: 'Display/presentation — a self-contained piece of content',
    element: 'article',
    alternateElements: ['section'],
    role: null,
    defaultAttributes: {},
    className: 'darsana',
  },
  vakya: {
    sanskrit: 'Vākya',
    devanagari: 'वाक्य',
    purpose: 'Text content — labels, titles, prose',
    element: 'p',
    alternateElements: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'],
    role: null,
    defaultAttributes: {},
    className: 'vakya',
  },
  pravesa: {
    sanskrit: 'Praveśa',
    devanagari: 'प्रवेश',
    purpose: 'Input/entry — receives data from the user',
    element: 'input',
    alternateElements: ['textarea', 'select'],
    role: null,
    defaultAttributes: {},
    className: 'pravesa',
  },
  pantha: {
    sanskrit: 'Panthā',
    devanagari: 'पन्था',
    purpose: 'Navigation/wayfinding — moves the user between views or sections',
    element: 'nav',
    alternateElements: [],
    role: 'navigation',
    defaultAttributes: {},
    className: 'pantha',
  },
  sangraha: {
    sanskrit: 'Saṅgraha',
    devanagari: 'सङ्ग्रह',
    purpose: 'Collection/gallery — a grid or set of related items',
    element: 'div',
    alternateElements: [],
    role: 'grid',
    defaultAttributes: { role: 'grid' },
    className: 'sangraha',
  },
  siras: {
    sanskrit: 'Śiras',
    devanagari: 'शिरस्',
    purpose: 'Header/banner — the top-level identity and context bar',
    element: 'header',
    alternateElements: [],
    role: 'banner',
    defaultAttributes: {},
    className: 'siras',
  },
  pada: {
    sanskrit: 'Pāda',
    devanagari: 'पाद',
    purpose: 'Footer/ground — persistent bottom region',
    element: 'footer',
    alternateElements: [],
    role: 'contentinfo',
    defaultAttributes: {},
    className: 'pada',
  },
  garbha: {
    sanskrit: 'Garbha',
    devanagari: 'गर्भ',
    purpose: 'Body/main content — the primary content area',
    element: 'main',
    alternateElements: [],
    role: 'main',
    defaultAttributes: {},
    className: 'garbha',
  },
  bindu: {
    sanskrit: 'Bindu',
    devanagari: 'बिन्दु',
    purpose: 'Single focus item — an individual card or row',
    element: 'article',
    alternateElements: [],
    role: null,
    defaultAttributes: {},
    className: 'bindu',
  },
};

/**
 * Resolve a Yantra name to its definition.
 *
 * @param {string} name — e.g., 'garbha', 'kriya', 'suci'
 * @returns {object} The Yantra definition
 */
export function resolveYantra(name) {
  const key = name.toLowerCase().replace(/[āīūṛṝḷḹśṣṇṅṃḥ]/g, match => {
    const map = { 'ā': 'a', 'ī': 'i', 'ū': 'u', 'ṛ': 'r', 'ṝ': 'r', 'ḷ': 'l', 'ḹ': 'l', 'ś': 's', 'ṣ': 's', 'ṇ': 'n', 'ṅ': 'n', 'ṃ': 'm', 'ḥ': 'h' };
    return map[match] || match;
  });
  const yantra = yantras[key];
  if (!yantra) {
    throw new Error(
      `Unknown Bodhi Yantra: "${name}". ` +
      `Available Yantras: ${Object.keys(yantras).join(', ')}`,
    );
  }
  return yantra;
}

/**
 * Get all Yantra definitions.
 */
export function getAllYantras() {
  return { ...yantras };
}

export default yantras;
