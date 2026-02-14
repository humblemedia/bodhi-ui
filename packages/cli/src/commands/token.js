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
import {
  contrastRatio,
  adjustForContrast,
} from '../../../tokens/src/contrast.js';

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

// ─── Contrast Adjustment Helpers ────────────────────────────

/**
 * Build a map of all resolved color values from the Rūpa file.
 * Resolves var() references to actual hex values.
 */
function buildColorMap(rupa) {
  const colorMap = {};
  
  // Base varna colors
  if (rupa.varna && typeof rupa.varna === 'object') {
    for (const [key, value] of Object.entries(rupa.varna)) {
      if (key === 'dark') continue;
      if (typeof value === 'string' && value.startsWith('#')) {
        colorMap[key] = value;
      }
    }
  }
  
  // Communicative tokens - resolve var() references
  for (const [name, token] of Object.entries(communicativeTokens)) {
    const value = token.defaultValue;
    if (value.startsWith('var(--bodhi-varna-')) {
      const varnaKey = value.match(/var\(--bodhi-varna-(\w+)\)/)?.[1];
      if (varnaKey && colorMap[varnaKey]) {
        colorMap[name] = colorMap[varnaKey];
      }
    }
  }
  
  return colorMap;
}

/**
 * Build dark mode color map
 */
function buildDarkColorMap(rupa) {
  const colorMap = {};
  
  if (rupa.varna?.dark && typeof rupa.varna.dark === 'object') {
    for (const [key, value] of Object.entries(rupa.varna.dark)) {
      if (typeof value === 'string' && value.startsWith('#')) {
        colorMap[key] = value;
      }
    }
  }
  
  // Communicative tokens in dark mode
  for (const [name, token] of Object.entries(communicativeTokens)) {
    const value = token.defaultValue;
    if (value.startsWith('var(--bodhi-varna-')) {
      const varnaKey = value.match(/var\(--bodhi-varna-(\w+)\)/)?.[1];
      if (varnaKey && colorMap[varnaKey]) {
        colorMap[name] = colorMap[varnaKey];
      }
    }
  }
  
  return colorMap;
}

/**
 * Resolve a var() reference to a hex color
 */
function resolveVarToHex(varString, colorMap) {
  if (!varString || typeof varString !== 'string') return null;
  
  // Already a hex color
  if (varString.startsWith('#')) return varString;
  
  // Extract variable name from var(--bodhi-varna-xxx)
  const match = varString.match(/var\(--bodhi-varna-(\w+(?:-\w+)?)\)/);
  if (!match) return null;
  
  const key = match[1];
  return colorMap[key] || null;
}

/**
 * Text roles to check for contrast
 */
const TEXT_ROLES = [
  { name: 'foreground', source: 'foreground' },
  { name: 'muted', source: 'muted' },
  { name: 'link', source: 'ahvana' },
];

/**
 * Check and generate contrast adjustments for nirmana components
 */
function generateContrastAdjustments(rupa, colorMap, isDarkMode = false) {
  const adjustments = [];
  const nirmana = rupa.nirmana || {};
  
  for (const [componentKey, componentData] of Object.entries(nirmana)) {
    if (!componentData || typeof componentData !== 'object') continue;
    if (!componentData.bg) continue;
    
    // Resolve background color
    const bgHex = resolveVarToHex(componentData.bg, colorMap);
    if (!bgHex) continue;
    
    // First, check if component has an explicit 'color' property
    if (componentData.color) {
      const colorHex = resolveVarToHex(componentData.color, colorMap);
      if (colorHex) {
        const ratio = contrastRatio(colorHex, bgHex);
        
        if (ratio < 7.0) {
          const adjustedHex = adjustForContrast(colorHex, bgHex, 7.0);
          
          if (adjustedHex && adjustedHex !== colorHex) {
            const newRatio = contrastRatio(adjustedHex, bgHex);
            adjustments.push({
              component: componentKey,
              role: '', // No role suffix for base color property
              source: 'color',
              bgHex,
              originalHex: colorHex,
              adjustedHex,
              originalRatio: ratio,
              newRatio,
            });
          }
        }
      }
    }
    
    // Then check each text role
    for (const role of TEXT_ROLES) {
      // Skip if developer provided an explicit override
      const overrideKey = `color-${role.name}`;
      if (componentData[overrideKey]) continue;
      
      // Get text color from color map
      const textHex = colorMap[role.source];
      if (!textHex) continue;
      
      // Check contrast
      const ratio = contrastRatio(textHex, bgHex);
      
      // If contrast is insufficient, adjust
      if (ratio < 7.0) {
        const adjustedHex = adjustForContrast(textHex, bgHex, 7.0);
        
        if (adjustedHex && adjustedHex !== textHex) {
          const newRatio = contrastRatio(adjustedHex, bgHex);
          adjustments.push({
            component: componentKey,
            role: role.name,
            source: role.source,
            bgHex,
            originalHex: textHex,
            adjustedHex,
            originalRatio: ratio,
            newRatio,
          });
        }
      }
    }
  }
  
  return adjustments;
}

/**
 * Generate CSS for contrast adjustments
 */
function generateContrastAdjustmentCSS(adjustments, isDarkMode = false) {
  if (adjustments.length === 0) return { lines: [], count: 0 };
  
  const lines = [];
  lines.push('');
  lines.push('/* ── Nirmāṇa: Contrast-Adjusted Colors ─────── */');
  lines.push('/* Auto-calculated for AAA compliance (7:1 minimum) */');
  lines.push('');
  
  // Group by component
  const byComponent = {};
  for (const adj of adjustments) {
    if (!byComponent[adj.component]) {
      byComponent[adj.component] = [];
    }
    byComponent[adj.component].push(adj);
  }
  
  for (const [componentKey, compAdjustments] of Object.entries(byComponent)) {
    const label = NIRMANA_LABELS[componentKey];
    const componentName = label ? `${label.sanskrit} (${componentKey})` : componentKey;
    const bgHex = compAdjustments[0].bgHex;
    
    lines.push(`/* ${componentName} on ${bgHex} */`);
    lines.push(':root {');
    
    for (const adj of compAdjustments) {
      const comment = `  /* adjusted from ${adj.originalHex} (was ${adj.originalRatio.toFixed(1)}:1 → now ${adj.newRatio.toFixed(1)}:1) */`;
      lines.push(comment);
      
      // Generate token name based on whether it's a role or base color
      const tokenName = adj.role 
        ? `--bodhi-nirmana-${adj.component}-color-${adj.role}`
        : `--bodhi-nirmana-${adj.component}-color`;
      
      lines.push(`  ${tokenName}: ${adj.adjustedHex};`);
    }
    
    lines.push('}');
    lines.push('');
  }
  
  return { lines, count: adjustments.length };
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

function generateNirmanaSection(rupa, adjustments = []) {
  const lines = [];
  const nirmana = rupa.nirmana || {};

  lines.push('');
  lines.push(sectionHeader('nirmana'));
  lines.push('');
  lines.push(':root {');

  let count = 0;
  const components = Object.keys(nirmana);
  
  // Build a set of component properties that will be adjusted
  const adjustedProps = new Set();
  for (const adj of adjustments) {
    if (!adj.role) {
      // This is a base color adjustment
      adjustedProps.add(`${adj.component}-color`);
    }
  }

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
        // Skip color property if it will be adjusted
        const propId = `${componentKey}-${propKey}`;
        if (adjustedProps.has(propId)) {
          continue;
        }
        
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
  let contrastAdjustments = [];
  if (rupa.nirmana && Object.keys(rupa.nirmana).length > 0) {
    // Calculate contrast adjustments first
    const colorMap = buildColorMap(rupa);
    contrastAdjustments = generateContrastAdjustments(rupa, colorMap, false);
    
    // Generate nirmana section, skipping properties that will be adjusted
    const nirmanaResult = generateNirmanaSection(rupa, contrastAdjustments);
    allLines.push(...nirmanaResult.lines);
    categoryCounts.nirmana = nirmanaResult.count;
    
    // Output the adjusted tokens
    if (contrastAdjustments.length > 0) {
      const contrastResult = generateContrastAdjustmentCSS(contrastAdjustments, false);
      allLines.push(...contrastResult.lines);
      categoryCounts['nirmana (adjusted)'] = contrastResult.count;
    }
  }
  
  // Dark mode contrast adjustments
  let darkContrastAdjustments = [];
  if (rupa.varna?.dark && rupa.nirmana) {
    const darkColorMap = buildDarkColorMap(rupa);
    darkContrastAdjustments = generateContrastAdjustments(rupa, darkColorMap, true);
    
    if (darkContrastAdjustments.length > 0) {
      const lines = [];
      lines.push('');
      lines.push('/* ── Nirmāṇa: Dark Mode Contrast Adjustments ── */');
      lines.push('');
      lines.push('@media (prefers-color-scheme: dark) {');
      
      // Group by component
      const byComponent = {};
      for (const adj of darkContrastAdjustments) {
        if (!byComponent[adj.component]) {
          byComponent[adj.component] = [];
        }
        byComponent[adj.component].push(adj);
      }
      
      for (const [componentKey, compAdjustments] of Object.entries(byComponent)) {
        const label = NIRMANA_LABELS[componentKey];
        const componentName = label ? `${label.sanskrit} (${componentKey})` : componentKey;
        const bgHex = compAdjustments[0].bgHex;
        
        lines.push(`  /* ${componentName} on ${bgHex} */`);
        lines.push('  :root {');
        
        for (const adj of compAdjustments) {
          const comment = `    /* adjusted from ${adj.originalHex} (was ${adj.originalRatio.toFixed(1)}:1 → now ${adj.newRatio.toFixed(1)}:1) */`;
          lines.push(comment);
          
          // Generate token name based on whether it's a role or base color
          const tokenName = adj.role 
            ? `--bodhi-nirmana-${adj.component}-color-${adj.role}`
            : `--bodhi-nirmana-${adj.component}-color`;
          
          lines.push(`    ${tokenName}: ${adj.adjustedHex};`);
        }
        
        lines.push('  }');
        lines.push('');
      }
      
      lines.push('}');
      
      allLines.push(...lines);
      categoryCounts['nirmana (dark adjusted)'] = darkContrastAdjustments.length;
    }
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
  console.log('');
  
  // ── Contrast report ───────────────────────────────────────
  const allAdjustments = [...contrastAdjustments, ...darkContrastAdjustments];
  if (allAdjustments.length > 0) {
    console.log('  Contrast adjustments (AAA 7:1):');
    
    // Group by component for display
    const byComponent = {};
    for (const adj of allAdjustments) {
      const key = `${adj.component}-${adj.role}`;
      if (!byComponent[key]) {
        byComponent[key] = adj;
      }
    }
    
    for (const adj of Object.values(byComponent)) {
      const componentPad = adj.component.padEnd(12);
      const rolePad = adj.role.padEnd(10);
      console.log(`    ${componentPad} ${rolePad} ${adj.originalHex} → ${adj.adjustedHex}  (was ${adj.originalRatio.toFixed(1)}:1, now ${adj.newRatio.toFixed(1)}:1)`);
    }
    console.log('');
  } else if (rupa.nirmana && Object.keys(rupa.nirmana).length > 0) {
    console.log('  ✓ All text colors pass AAA contrast (7:1)');
    console.log('');
  }

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
