/**
 * bodhi token compile — Compile brand Rūpa to CSS.
 *
 * Reads a brand Rūpa JSON file, resolves poetic tokens through
 * the lookup table, and outputs CSS custom properties.
 *
 * This is purely deterministic — no AI. A developer writing
 * `vicāra` gets a known value from the lookup table.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

/**
 * Flatten a nested object into CSS custom property paths.
 * { varna: { primary: '#2563eb' } } → { '--bodhi-varna-primary': '#2563eb' }
 */
function flattenTokens(obj, prefix = '--bodhi') {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip schema metadata
    if (key.startsWith('$')) continue;
    if (key === 'name' || key === 'version') continue;

    const propName = `${prefix}-${key}`;

    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTokens(value, propName));
    } else {
      result[propName] = value;
    }
  }

  return result;
}

/**
 * Generate CSS from flattened tokens.
 */
function generateCSS(tokens) {
  const lines = [
    '/**',
    ' * Bodhi Design Tokens — Auto-generated from Rūpa brand file.',
    ' * Do not edit directly. Modify bodhi.rupa.json and recompile.',
    ' *',
    ' * बोधि — Awakening for the web.',
    ' */',
    '',
    ':root {',
  ];

  for (const [prop, value] of Object.entries(tokens)) {
    lines.push(`  ${prop}: ${value};`);
  }

  lines.push('}');
  lines.push('');

  // Add prefers-reduced-motion media query
  lines.push('/* Respect user motion preferences — this is non-negotiable */');
  lines.push('@media (prefers-reduced-motion: reduce) {');
  lines.push('  :root {');
  lines.push('    --bodhi-calana-duration: 0ms;');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

export async function tokenCompile(file, options) {
  const inputPath = file || 'bodhi.rupa.json';
  const outputPath = options.output || 'bodhi-tokens.css';

  console.log('');
  console.log('  बोधि token compile');
  console.log('');

  if (!existsSync(inputPath)) {
    console.error(`  ✗ Brand file not found: ${inputPath}`);
    console.error('    Run: bodhi init — to create a default brand file.');
    process.exit(1);
  }

  try {
    const raw = readFileSync(inputPath, 'utf-8');
    const rupa = JSON.parse(raw);

    console.log(`  Reading: ${inputPath}`);
    console.log(`  Brand: ${rupa.name || 'unnamed'} v${rupa.version || '0.0.0'}`);

    const tokens = flattenTokens(rupa);
    const tokenCount = Object.keys(tokens).length;

    const css = generateCSS(tokens);
    writeFileSync(outputPath, css);

    console.log(`  Compiled ${tokenCount} tokens → ${outputPath}`);
    console.log('');
    console.log('  ✓ Rūpa compiled. The form arises from the tokens.');
    console.log('');
  } catch (error) {
    console.error(`  ✗ Error compiling tokens: ${error.message}`);
    process.exit(1);
  }
}
