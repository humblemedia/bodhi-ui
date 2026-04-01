/**
 * Bodhi HTML Emitter
 *
 * Yantra spec nodes → semantic HTML with data attributes and ARIA roles.
 */

import { resolveYantra } from '@bodhi/tokens';

/**
 * Emit HTML string from a component spec node.
 */
export function emitHtml(node, indent = 0) {
  const pad = '  '.repeat(indent);
  const yantra = resolveYantra(node.yantra);

  // Determine element: explicit override or Yantra default
  const element = node.element || yantra.element;

  // Build attributes
  const attrs = buildAttributes(node, yantra);
  const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

  // Self-closing elements
  const selfClosing = ['input', 'br', 'hr', 'img'].includes(element);

  if (selfClosing) {
    return `${pad}<${element}${attrStr} />`;
  }

  const lines = [];
  lines.push(`${pad}<${element}${attrStr}>`);

  // Content
  if (node.content !== undefined) {
    if (node.bind) {
      lines.push(`${pad}  <span data-bodhi-bind="${node.bind}">${escapeHtml(node.content)}</span>`);
    } else {
      lines.push(`${pad}  ${escapeHtml(node.content)}`);
    }
  } else if (node.bind && !node.children && !node.views) {
    lines.push(`${pad}  <span data-bodhi-bind="${node.bind}"></span>`);
  }

  // Children
  if (node.children) {
    for (const child of node.children) {
      lines.push(emitHtml(child, indent + 1));
    }
  }

  // Views (tab/conditional content regions)
  if (node.views) {
    for (const view of node.views) {
      lines.push(emitHtml({ ...view, attributes: { ...view.attributes, 'data-bodhi-view': view.id } }, indent + 1));
    }
  }

  lines.push(`${pad}</${element}>`);
  return lines.join('\n');
}

function buildAttributes(node, yantra) {
  const attrs = [];

  // Class: combine yantra className, mudra classNames, and explicit class
  const classes = [yantra.className];
  if (node.class) classes.push(node.class);
  attrs.push(`class="${classes.join(' ')}"`);

  // Data attributes
  attrs.push(`data-bodhi-yantra="${yantra.className}"`);

  if (node.mudras && node.mudras.length) {
    const mudraNames = node.mudras.map(m => m.toLowerCase().replace(/[āīūṛṝḷḹśṣṇṃḥ]/g, match => {
      const map = { 'ā': 'a', 'ī': 'i', 'ū': 'u', 'ṛ': 'r', 'ṝ': 'r', 'ḷ': 'l', 'ḹ': 'l', 'ś': 's', 'ṣ': 's', 'ṇ': 'n', 'ṃ': 'm', 'ḥ': 'h' };
      return map[match] || match;
    }).replace(/[^a-z]/g, ''));
    attrs.push(`data-bodhi-mudra="${mudraNames.join(' ')}"`);
  }

  // ARIA role from Yantra (unless element already implies it)
  if (yantra.role) {
    const implicitRoles = { nav: 'navigation', main: 'main', header: 'banner', footer: 'contentinfo', button: 'button' };
    if (implicitRoles[node.element || yantra.element] !== yantra.role) {
      attrs.push(`role="${yantra.role}"`);
    }
  }

  // Yantra default attributes
  if (yantra.defaultAttributes) {
    for (const [k, v] of Object.entries(yantra.defaultAttributes)) {
      if (k === 'role') continue; // handled above
      attrs.push(`${k}="${v}"`);
    }
  }

  // Explicit attributes from spec
  if (node.attributes) {
    for (const [k, v] of Object.entries(node.attributes)) {
      if (k === 'role' || k === 'class') continue; // handled above
      attrs.push(`${k}="${v}"`);
    }
  }

  // Component name as data attribute
  if (node.component) {
    attrs.push(`data-bodhi-component="${node.component}"`);
  }

  // View id
  if (node.id) {
    attrs.push(`id="${node.id}"`);
  }

  // Bind reference
  if (node.bind) {
    attrs.push(`data-bodhi-bind="${node.bind}"`);
  }

  // Event handlers as data attributes
  if (node.on) {
    for (const [event, handler] of Object.entries(node.on)) {
      attrs.push(`data-bodhi-on-${event}="${handler}"`);
    }
  }

  return attrs;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
