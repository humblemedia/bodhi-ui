/**
 * Bodhi Rūpa Schema Validator
 *
 * Validates a brand Rūpa JSON file against the 10 Rūpa categories.
 * Returns structured results: { valid, errors, warnings }.
 *
 * The 10 Rūpa (रूप) categories:
 *   varna, lipi, akasa, pramana, sima, chaya, pratima, calana, ghanatva, yukti
 */

import { spatialTokens, voiceTokens } from '../lookup/poetic-tokens.js';

const REQUIRED_CATEGORIES = ['varna', 'lipi', 'akasa'];

const OPTIONAL_CATEGORIES = [
  'pramana', 'sima', 'chaya', 'pratima', 'calana', 'ghanatva', 'yukti',
];

const ALL_CATEGORIES = [...REQUIRED_CATEGORIES, ...OPTIONAL_CATEGORIES];

const METADATA_FIELDS = ['name', 'version', '$schema'];

const CATEGORY_META = {
  varna:    { sanskrit: 'Varṇa',    purpose: 'Colors' },
  lipi:     { sanskrit: 'Lipi',      purpose: 'Typography' },
  akasa:    { sanskrit: 'Ākāśa',    purpose: 'Spacing' },
  pramana:  { sanskrit: 'Pramāṇa',  purpose: 'Sizing' },
  sima:     { sanskrit: 'Sīmā',     purpose: 'Borders' },
  chaya:    { sanskrit: 'Chāyā',    purpose: 'Shadows' },
  pratima:  { sanskrit: 'Pratimā',   purpose: 'Icons' },
  calana:   { sanskrit: 'Calana',    purpose: 'Motion' },
  ghanatva: { sanskrit: 'Ghanatva',  purpose: 'Density' },
  yukti:    { sanskrit: 'Yukti',     purpose: 'Special treatments' },
};

/** Valid poetic spatial token keys (for akasa) */
const SPATIAL_TOKEN_NAMES = Object.keys(spatialTokens);

/** Valid poetic voice token keys (for lipi.scale) */
const VOICE_TOKEN_NAMES = Object.keys(voiceTokens);

/**
 * Test whether a string is a valid CSS color value.
 * Accepts: hex (#rgb, #rrggbb, #rrggbbaa), rgb(), rgba(), hsl(), hsla(),
 * oklch(), named colors, currentColor, transparent, inherit, and
 * CSS custom property references var(--...).
 */
const CSS_COLOR_RE = /^(#([0-9a-f]{3,8})|rgba?\(.*\)|hsla?\(.*\)|oklch\(.*\)|var\(--[\w-]+\)|transparent|currentColor|inherit|initial|unset|revert)$/i;

const NAMED_COLORS = new Set([
  'black', 'silver', 'gray', 'grey', 'white', 'maroon', 'red', 'purple',
  'fuchsia', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal',
  'aqua', 'orange', 'aliceblue', 'antiquewhite', 'aquamarine', 'azure',
  'beige', 'bisque', 'blanchedalmond', 'blueviolet', 'brown', 'burlywood',
  'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue',
  'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod',
  'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
  'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon',
  'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray',
  'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
  'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'greenyellow', 'honeydew',
  'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
  'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
  'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
  'limegreen', 'linen', 'magenta', 'mediumaquamarine', 'mediumblue',
  'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue',
  'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
  'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'oldlace',
  'olivedrab', 'orangered', 'orchid', 'palegoldenrod', 'palegreen',
  'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru',
  'pink', 'plum', 'powderblue', 'rosybrown', 'royalblue', 'saddlebrown',
  'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'skyblue',
  'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue',
  'tan', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'whitesmoke',
  'yellowgreen', 'rebeccapurple',
]);

function isValidCSSColor(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim().toLowerCase();
  return CSS_COLOR_RE.test(trimmed) || NAMED_COLORS.has(trimmed);
}

/**
 * Validate color values recursively in an object.
 * Skips sub-objects named 'dark' (handled separately for dark mode).
 */
function validateColorValues(obj, path, errors) {
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'dark') continue; // dark mode block validated separately
    const fullPath = `${path}.${key}`;
    if (typeof value === 'object' && value !== null) {
      validateColorValues(value, fullPath, errors);
    } else if (typeof value === 'string') {
      if (!isValidCSSColor(value)) {
        errors.push(`Invalid CSS color at ${fullPath}: "${value}"`);
      }
    }
  }
}

/**
 * Validate a brand Rūpa JSON object.
 *
 * @param {object} rupa — The parsed Rūpa JSON
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateRupa(rupa) {
  const errors = [];
  const warnings = [];

  if (typeof rupa !== 'object' || rupa === null || Array.isArray(rupa)) {
    errors.push('Rūpa file must be a JSON object.');
    return { valid: false, errors, warnings };
  }

  // Check for unknown top-level keys
  const allKnown = new Set([...ALL_CATEGORIES, ...METADATA_FIELDS]);
  for (const key of Object.keys(rupa)) {
    if (!allKnown.has(key)) {
      warnings.push(`Unknown top-level key: "${key}" — will be ignored.`);
    }
  }

  // Required categories
  for (const cat of REQUIRED_CATEGORIES) {
    if (!rupa[cat]) {
      const meta = CATEGORY_META[cat];
      errors.push(
        `Missing required category: "${cat}" (${meta.sanskrit} — ${meta.purpose}). ` +
        `Add a "${cat}" object to your Rūpa file.`,
      );
    }
  }

  // Optional categories — warn if missing
  for (const cat of OPTIONAL_CATEGORIES) {
    if (!rupa[cat]) {
      const meta = CATEGORY_META[cat];
      warnings.push(
        `Optional category "${cat}" (${meta.sanskrit} — ${meta.purpose}) not defined. ` +
        `Defaults will be used.`,
      );
    }
  }

  // Validate varna (color values)
  if (rupa.varna && typeof rupa.varna === 'object') {
    validateColorValues(rupa.varna, 'varna', errors);
    // Validate dark mode colors too
    if (rupa.varna.dark && typeof rupa.varna.dark === 'object') {
      validateColorValues(rupa.varna.dark, 'varna.dark', errors);
    }
  }

  // Validate lipi voice token names in scale
  if (rupa.lipi && typeof rupa.lipi === 'object') {
    if (rupa.lipi.scale && typeof rupa.lipi.scale === 'object') {
      for (const key of Object.keys(rupa.lipi.scale)) {
        if (!VOICE_TOKEN_NAMES.includes(key)) {
          warnings.push(
            `lipi.scale key "${key}" is not a recognized voice token. ` +
            `Known voices: ${VOICE_TOKEN_NAMES.join(', ')}`,
          );
        }
      }
    }
  }

  // Validate akasa spatial token names
  if (rupa.akasa && typeof rupa.akasa === 'object') {
    for (const key of Object.keys(rupa.akasa)) {
      if (!SPATIAL_TOKEN_NAMES.includes(key)) {
        warnings.push(
          `akasa key "${key}" is not a recognized spatial token. ` +
          `Known spatial tokens: ${SPATIAL_TOKEN_NAMES.join(', ')}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export { CATEGORY_META, ALL_CATEGORIES, REQUIRED_CATEGORIES, OPTIONAL_CATEGORIES };
