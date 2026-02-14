/**
 * bodhi token compile — Compile brand Rūpa to CSS.
 *
 * Reads a brand Rūpa JSON file, validates it against the schema,
 * resolves poetic tokens through the lookup table, and outputs
 * structured CSS custom properties with Sanskrit commentary.
 *
 * This is purely deterministic — no AI. A developer writing
 * `vicāra` gets a known value from the lookup table.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  spatialTokens,
  communicativeTokens,
  voiceTokens,
} from '../../../tokens/src/lookup/poetic-tokens.js';
import {
  validateRupa,
  CATEGORY_META,
  ALL_CATEGORIES,
} from '../../../tokens/src/schema/rupa-validator.js';

// ─── Category Section Metadata ──────────────────────────────

const SECTION_META = {
  varna: {
    sanskrit: 'Varṇa',
    devanagari: 'वर्ण',
    english: 'Color',
    description: 'Semantic color roles, not hue names.',
  },
  lipi: {
    sanskrit: 'Lipi',
    devanagari: 'लिपि',
    english: 'Typography',
    description: 'Typeface families, scale, weight, and leading.',
  },
  akasa: {
    sanskrit: 'Ākāśa',
    devanagari: 'आकाश',
    english: 'Spacing',
    description: 'Spatial intent — how much breathing room an element needs.',
  },
  pramana: {
    sanskrit: 'Pramāṇa',
    devanagari: 'प्रमाण',
    english: 'Sizing',
    description: 'Widths, heights, and region dimensions.',
  },
  sima: {
    sanskrit: 'Sīmā',
    devanagari: 'सीमा',
    english: 'Borders',
    description: 'Border widths, radii, and focus rings.',
  },
  chaya: {
    sanskrit: 'Chāyā',
    devanagari: 'छाया',
    english: 'Shadows',
    description: 'Elevation and depth scale.',
  },
  pratima: {
    sanskrit: 'Pratimā',
    devanagari: 'प्रतिमा',
    english: 'Icons',
    description: 'Icon set, sizes, and alignment.',
  },
  calana: {
    sanskrit: 'Calana',
    devanagari: 'चलन',
    english: 'Motion',
    description: 'Duration and easing curves.',
  },
  ghanatva: {
    sanskrit: 'Ghanatva',
    devanagari: 'घनत्व',
    english: 'Density',
    description: 'Compact, comfortable, and spacious modes.',
  },
  yukti: {
    sanskrit: 'Yukti',
    devanagari: 'युक्ति',
    english: 'Special Treatments',
    description: 'Per-Yantra treatments and effects.',
  },
  nirmana: {
    sanskrit: 'Nirmāṇa',
    devanagari: 'निर्माण',
    english: 'Structural Defaults',
    description: 'Default appearance for Aṅga and Maṇḍala components.\nOverride per-brand by changing which tokens are referenced.',
  },
};

// ─── Nirmāṇa Component Labels ────────────────────────────

const NIRMANA_LABELS = {
  siras:    { sanskrit: 'Śiras',    devanagari: 'शिरस्',   english: 'Header' },
  pada:     { sanskrit: 'Pāda',     devanagari: 'पाद',     english: 'Footer' },
  garbha:   { sanskrit: 'Garbha',   devanagari: 'गर्भ',    english: 'Body' },
  bindu:    { sanskrit: 'Bindu',    devanagari: 'बिन्दु',   english: 'Single Focus' },
  sangraha: { sanskrit: 'Saṅgraha', devanagari: 'सङ्ग्रह',  english: 'Collection' },
  paricaya: { sanskrit: 'Paricaya', devanagari: 'परिचय',   english: 'Profile' },
  card:     { sanskrit: 'Card',     devanagari: null,       english: 'Reusable container' },
};

// ─── Default Values for Optional Categories ─────────────────

const DEFAULTS = {
  pramana: {
    'content-width': '65ch',
    'sidebar-width': '16rem',
    'header-height': '3.5rem',
  },
  sima: {
    'width-thin': '1px',
    'width-medium': '2px',
    'radius-md': '0.5rem',
    'focus-ring': '2px solid currentColor',
  },
  chaya: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  pratima: {},
  calana: {
    'duration-normal': '200ms',
    'easing-default': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  ghanatva: {},
  yukti: {},
};

// ─── Helpers ────────────────────────────────────────────────

/**
 * Flatten a nested object into CSS custom property paths.
 * { width: { thin: '1px' } } with prefix '--bodhi-sima'
 * → { '--bodhi-sima-width-thin': '1px' }
 */
function flattenTokens(obj, prefix) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip metadata and dark mode (handled separately)
    if (key.startsWith('$') || key === 'name' || key === 'version' || key === 'dark') continue;
    const propName = `${prefix}-${key}`;
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTokens(value, propName));
    } else {
      result[propName] = String(value);
    }
  }
  return result;
}

function sectionHeader(category) {
  const meta = SECTION_META[category];
  if (!meta) return '';
  const rule = '═'.repeat(56);
  return [
    `/* ${rule}`,
    ` * ${meta.sanskrit} (${meta.devanagari}) — ${meta.english}`,
    ` * ${meta.description}`,
    ` * ${rule} */`,
  ].join('\n');
}

function subSectionHeader(title) {
  const rule = '─'.repeat(45);
  return `/* ── ${title} ${rule.slice(title.length + 4)} */`;
}

function poeticComment(token) {
  return `/* ${token.sanskrit} (${token.devanagari}) — ${token.intent} */`;
}

function cssLine(prop, value) {
  return `:root { ${prop}: ${value}; }`;
}

// ─── CSS Generation ─────────────────────────────────────────

function generateFileHeader(rupa) {
  const name = rupa.name || 'unnamed';
  const version = rupa.version || '0.0.0';
  const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');

  return [
    '/**',
    ' * Bodhi Design Tokens',
    ` * Brand: ${name} v${version}`,
    ` * Generated: ${timestamp}`,
    ' *',
    ' * बोधि — Awakening for the web.',
    ' * Do not edit directly. Modify your .rupa.json and recompile.',
    ' */',
  ].join('\n');
}

function generateVarnaSection(rupa) {
  const lines = [];
  const varna = rupa.varna || {};

  lines.push('');
  lines.push(sectionHeader('varna'));
  lines.push('');

  // Collect base color tokens (not dark, not poetic)
  const baseColors = {};
  for (const [key, value] of Object.entries(varna)) {
    if (key === 'dark') continue;
    if (typeof value === 'string') {
      baseColors[key] = value;
    }
  }

  // Base color block
  if (Object.keys(baseColors).length > 0) {
    lines.push(':root {');
    for (const [key, value] of Object.entries(baseColors)) {
      lines.push(`  --bodhi-varna-${key}: ${value};`);
    }
    lines.push('}');
  }

  // Communicative acts (poetic tokens)
  lines.push('');
  lines.push(subSectionHeader('Varṇa: Communicative Acts'));
  for (const [name, token] of Object.entries(communicativeTokens)) {
    lines.push(poeticComment(token));
    lines.push(cssLine(token.cssProperty, token.defaultValue));
  }

  return { lines, count: Object.keys(baseColors).length + Object.keys(communicativeTokens).length };
}

function generateLipiSection(rupa) {
  const lines = [];
  const lipi = rupa.lipi || {};

  lines.push('');
  lines.push(sectionHeader('lipi'));
  lines.push('');

  // Font families
  if (lipi.family && typeof lipi.family === 'object') {
    lines.push(':root {');
    for (const [key, value] of Object.entries(lipi.family)) {
      lines.push(`  --bodhi-lipi-family-${key}: ${value};`);
    }
    lines.push('}');
  }

  // Weight
  if (lipi.weight && typeof lipi.weight === 'object') {
    lines.push('');
    lines.push(':root {');
    for (const [key, value] of Object.entries(lipi.weight)) {
      lines.push(`  --bodhi-lipi-weight-${key}: ${value};`);
    }
    lines.push('}');
  }

  // Leading
  if (lipi.leading && typeof lipi.leading === 'object') {
    lines.push('');
    lines.push(':root {');
    for (const [key, value] of Object.entries(lipi.leading)) {
      lines.push(`  --bodhi-lipi-leading-${key}: ${value};`);
    }
    lines.push('}');
  }

  // Voice tokens (poetic)
  lines.push('');
  lines.push(subSectionHeader('Lipi: Voices'));
  let voiceCount = 0;
  for (const [name, token] of Object.entries(voiceTokens)) {
    const brandValue = lipi.scale?.[name];
    const value = brandValue || token.defaultValue;
    lines.push(poeticComment(token));
    lines.push(cssLine(token.cssProperty, value));
    voiceCount++;
  }

  // Count all tokens in this section
  let count = voiceCount;
  if (lipi.family) count += Object.keys(lipi.family).length;
  if (lipi.weight) count += Object.keys(lipi.weight).length;
  if (lipi.leading) count += Object.keys(lipi.leading).length;

  return { lines, count };
}

function generateAkasaSection(rupa) {
  const lines = [];
  const akasa = rupa.akasa || {};

  lines.push('');
  lines.push(sectionHeader('akasa'));
  lines.push('');
  lines.push(subSectionHeader('Ākāśa: Spatial Intent'));

  let count = 0;
  for (const [name, token] of Object.entries(spatialTokens)) {
    const brandValue = akasa[name];
    const value = brandValue || token.defaultValue;
    lines.push(poeticComment(token));
    lines.push(cssLine(token.cssProperty, value));
    count++;
  }

  return { lines, count };
}

function generateGenericSection(category, data) {
  const lines = [];

  lines.push('');
  lines.push(sectionHeader(category));
  lines.push('');

  const tokens = flattenTokens(data, `--bodhi-${category}`);
  if (Object.keys(tokens).length > 0) {
    lines.push(':root {');
    for (const [prop, value] of Object.entries(tokens)) {
      lines.push(`  ${prop}: ${value};`);
    }
    lines.push('}');
  }

  return { lines, count: Object.keys(tokens).length };
}

function generateNirmanaSection(rupa) {
  const lines = [];
  const nirmana = rupa.nirmana || {};

  lines.push('');
  lines.push(sectionHeader('nirmana'));
  lines.push('');
  lines.push(':root {');

  let count = 0;
  const components = Object.keys(nirmana);

  for (let i = 0; i < components.length; i++) {
    const componentKey = components[i];
    const componentData = nirmana[componentKey];

    // Add component header comment
    const label = NIRMANA_LABELS[componentKey];
    if (label) {
      const devanagariPart = label.devanagari ? ` (${label.devanagari})` : '';
      lines.push(`  /* ── ${label.sanskrit}${devanagariPart} — ${label.english} ${String('─').repeat(Math.max(0, 45 - label.sanskrit.length - (label.devanagari ? label.devanagari.length + 3 : 0) - label.english.length - 7))} */`);
    } else {
      // Fallback for custom components
      lines.push(`  /* ── ${componentKey} ${String('─').repeat(Math.max(0, 45 - componentKey.length - 4))} */`);
    }

    // Add properties for this component
    if (typeof componentData === 'object' && componentData !== null) {
      for (const [propKey, propValue] of Object.entries(componentData)) {
        lines.push(`  --bodhi-nirmana-${componentKey}-${propKey}: ${propValue};`);
        count++;
      }
    }

    // Add spacing between components, except after the last one
    if (i < components.length - 1) {
      lines.push('');
    }
  }

  lines.push('}');

  return { lines, count };
}

function generateDarkMode(rupa) {
  const dark = rupa.varna?.dark;
  if (!dark || typeof dark !== 'object' || Object.keys(dark).length === 0) {
    return { lines: [], count: 0 };
  }

  const lines = [];
  lines.push('');
  lines.push(subSectionHeader('Varṇa: Dark Mode'));
  lines.push('');
  lines.push('@media (prefers-color-scheme: dark) {');
  lines.push('  :root {');

  let count = 0;
  for (const [key, value] of Object.entries(dark)) {
    lines.push(`    --bodhi-varna-${key}: ${value};`);
    count++;
  }

  lines.push('  }');
  lines.push('}');

  return { lines, count };
}

function generateAccessibilityOverrides() {
  const lines = [];
  const rule = '═'.repeat(56);

  lines.push('');
  lines.push([
    `/* ${rule}`,
    ` * Bodhi Enforced — Non-negotiable accessibility`,
    ` * These cannot be overridden by brand tokens.`,
    ` * ${rule} */`,
  ].join('\n'));
  lines.push('');
  lines.push('@media (prefers-reduced-motion: reduce) {');
  lines.push('  :root {');
  lines.push('    --bodhi-calana-duration: 0ms;');
  lines.push('    --bodhi-calana-easing: linear;');
  lines.push('  }');
  lines.push('}');
  lines.push('');
  lines.push('@media (prefers-contrast: more) {');
  lines.push('  :root {');
  lines.push('    --bodhi-sima-focus-ring: 3px solid currentColor;');
  lines.push('  }');
  lines.push('}');

  return lines;
}

// ─── Main Compiler ──────────────────────────────────────────

export async function tokenCompile(file, options) {
  const inputPath = file || 'bodhi.rupa.json';
  const outputPath = options.output || 'bodhi-tokens.css';
  const verbose = options.verbose || false;

  console.log('');
  console.log('  बोधि token compile');
  console.log('');

  if (!existsSync(inputPath)) {
    console.error(`  ✗ Brand file not found: ${inputPath}`);
    console.error('    Run: bodhi init — to create a default brand file.');
    process.exit(1);
  }

  let rupa;
  try {
    const raw = readFileSync(inputPath, 'utf-8');
    rupa = JSON.parse(raw);
  } catch (error) {
    console.error(`  ✗ Failed to parse ${inputPath}: ${error.message}`);
    process.exit(1);
  }

  const brandName = rupa.name || 'unnamed';
  const brandVersion = rupa.version || '0.0.0';
  console.log(`  Reading: ${inputPath}`);
  console.log(`  Brand:   ${brandName} v${brandVersion}`);
  console.log('');

  // ── Validate ──────────────────────────────────────────
  const validation = validateRupa(rupa);

  if (validation.warnings.length > 0) {
    console.log(`  ⚠ ${validation.warnings.length} warning(s):`);
    for (const w of validation.warnings) {
      console.log(`    · ${w}`);
    }
    console.log('');
  }

  if (!validation.valid) {
    console.error(`  ✗ ${validation.errors.length} validation error(s):`);
    for (const e of validation.errors) {
      console.error(`    ✗ ${e}`);
    }
    console.error('');
    console.error('  Fix the errors above and recompile.');
    process.exit(1);
  }

  // ── Generate CSS ──────────────────────────────────────
  const allLines = [];
  const categoryCounts = {};

  // File header
  allLines.push(generateFileHeader(rupa));

  // Varna (colors)
  const varnaResult = generateVarnaSection(rupa);
  allLines.push(...varnaResult.lines);
  categoryCounts.varna = varnaResult.count;

  // Dark mode
  const darkResult = generateDarkMode(rupa);
  if (darkResult.count > 0) {
    allLines.push(...darkResult.lines);
    categoryCounts['varna (dark)'] = darkResult.count;
  }

  // Lipi (typography)
  const lipiResult = generateLipiSection(rupa);
  allLines.push(...lipiResult.lines);
  categoryCounts.lipi = lipiResult.count;

  // Akasa (spacing)
  const akasaResult = generateAkasaSection(rupa);
  allLines.push(...akasaResult.lines);
  categoryCounts.akasa = akasaResult.count;

  // Remaining categories
  const genericCategories = ['pramana', 'sima', 'chaya', 'pratima', 'calana', 'ghanatva', 'yukti'];
  for (const cat of genericCategories) {
    const data = rupa[cat] || DEFAULTS[cat];
    if (data && Object.keys(data).length > 0) {
      const result = generateGenericSection(cat, data);
      allLines.push(...result.lines);
      categoryCounts[cat] = result.count;
    }
  }

  // Nirmana (structural defaults)
  if (rupa.nirmana && Object.keys(rupa.nirmana).length > 0) {
    const nirmanaResult = generateNirmanaSection(rupa);
    allLines.push(...nirmanaResult.lines);
    categoryCounts.nirmana = nirmanaResult.count;
  }

  // Accessibility overrides
  allLines.push(...generateAccessibilityOverrides());

  // Final newline
  allLines.push('');

  const css = allLines.join('\n');

  // ── Write output ──────────────────────────────────────
  writeFileSync(outputPath, css);

  const totalTokens = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const fileSize = Buffer.byteLength(css, 'utf-8');
  const fileSizeKB = (fileSize / 1024).toFixed(1);

  console.log('  Token counts:');
  for (const [cat, count] of Object.entries(categoryCounts)) {
    const padded = cat.padEnd(16);
    console.log(`    ${padded} ${count}`);
  }
  console.log(`    ${'─'.repeat(24)}`);
  console.log(`    ${'total'.padEnd(16)} ${totalTokens}`);
  console.log('');
  console.log(`  Compiled ${totalTokens} tokens → ${outputPath} (${fileSizeKB} KB)`);

  // ── Verbose: poetic token details ─────────────────────
  if (verbose) {
    console.log('');
    console.log('  Poetic token resolution:');
    console.log('');

    const allPoetic = { ...spatialTokens, ...communicativeTokens, ...voiceTokens };
    for (const [name, token] of Object.entries(allPoetic)) {
      // Determine the resolved value
      let resolvedValue = token.defaultValue;
      if (spatialTokens[name] && rupa.akasa?.[name]) {
        resolvedValue = rupa.akasa[name];
      } else if (voiceTokens[name] && rupa.lipi?.scale?.[name]) {
        resolvedValue = rupa.lipi.scale[name];
      }
      const padName = token.sanskrit.padEnd(12);
      const padProp = token.cssProperty.padEnd(28);
      console.log(`    ${padName} ${padProp} → ${resolvedValue}`);
    }
  }

  console.log('');
  console.log('  ✓ Rūpa compiled. The form arises from the tokens.');
  console.log('');
}
