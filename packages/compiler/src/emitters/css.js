/**
 * Bodhi CSS Emitter
 *
 * Mudra definitions → CSS classes referencing Bodhi token variables.
 * Enforces the no-scroll constraint on Garbha yantra.
 */

import { resolveYantra, resolveMudra } from '@bodhi/tokens';

/**
 * Collect all unique Yantras and Mudras from a spec tree.
 */
function collectUsed(node, yantras = new Set(), mudras = new Set()) {
  if (node.yantra) yantras.add(node.yantra);
  if (node.mudras) node.mudras.forEach(m => mudras.add(m));
  if (node.children) node.children.forEach(c => collectUsed(c, yantras, mudras));
  if (node.views) node.views.forEach(v => collectUsed(v, yantras, mudras));
  return { yantras, mudras };
}

/**
 * Emit a CSS string for all Yantras and Mudras used in a spec.
 */
export function emitCss(spec) {
  const { yantras, mudras } = collectUsed(spec);
  const lines = [];

  lines.push('/* Bodhi Compiled Styles */');
  lines.push('/* Yantra base styles */');
  lines.push('');

  // Yantra base styles
  for (const name of yantras) {
    const yantra = resolveYantra(name);
    lines.push(`.${yantra.className} {`);
    lines.push('  box-sizing: border-box;');

    // Garbha (main content) enforces no-scroll
    if (yantra.className === 'garbha') {
      lines.push('  overflow: hidden; /* Bodhi no-scroll constraint */');
    }

    lines.push('}');
    lines.push('');
  }

  lines.push('/* Mudra modifier styles */');
  lines.push('');

  // Mudra modifier classes
  for (const name of mudras) {
    const mudra = resolveMudra(name);
    lines.push(`.${mudra.className} {`);
    for (const [prop, value] of Object.entries(mudra.css)) {
      lines.push(`  ${prop}: ${value};`);
    }
    lines.push('}');
    lines.push('');
  }

  // Gupta (hidden/revealed) utility classes
  if (mudras.has('Gupta') || mudras.has('gupta')) {
    lines.push('.mudra-gupta[data-bodhi-hidden="true"] {');
    lines.push('  display: none;');
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}
