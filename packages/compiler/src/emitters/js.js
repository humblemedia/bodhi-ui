/**
 * Bodhi JS Emitter
 *
 * Generates Cetana integration code from bind/on properties in specs.
 * Only emits JS when the spec contains interactive bindings.
 */

/**
 * Collect all bindings and event handlers from a spec tree.
 */
function collectBindings(node, bindings = [], events = [], path = 'root') {
  if (node.bind) {
    bindings.push({ bind: node.bind, path, component: node.component });
  }
  if (node.on) {
    for (const [event, handler] of Object.entries(node.on)) {
      events.push({ event, handler, path, component: node.component });
    }
  }
  if (node.children) {
    node.children.forEach((c, i) => collectBindings(c, bindings, events, `${path}.children[${i}]`));
  }
  if (node.views) {
    node.views.forEach((v, i) => collectBindings(v, bindings, events, `${path}.views[${i}]`));
  }
  return { bindings, events };
}

/**
 * Emit JS module code for Cetana integration.
 * Returns empty string if no bindings or events exist.
 */
export function emitJs(spec) {
  const { bindings, events } = collectBindings(spec);

  if (bindings.length === 0 && events.length === 0) {
    return '';
  }

  const lines = [];
  lines.push("import { signal, computed, mount } from '@bodhi/cetana';");
  lines.push('');

  // Generate signal declarations for each unique binding
  const uniqueBinds = [...new Set(bindings.map(b => b.bind))];
  for (const name of uniqueBinds) {
    lines.push(`export const ${name} = signal(null);`);
  }

  if (uniqueBinds.length) lines.push('');

  // Generate mount function
  const componentName = spec.component || 'App';
  lines.push(`export function init${componentName}(root) {`);
  lines.push('  return mount(root, (el) => {');
  lines.push('    const unsubs = [];');
  lines.push('');

  // Bind subscriptions
  for (const { bind } of bindings) {
    lines.push(`    // Bind: ${bind}`);
    lines.push(`    unsubs.push(${bind}.subscribe(value => {`);
    lines.push(`      const target = el.querySelector('[data-bodhi-bind="${bind}"]');`);
    lines.push('      if (target) target.textContent = value ?? \'\';');
    lines.push('    }));');
    lines.push('');
  }

  // Event handlers
  for (const { event, handler } of events) {
    lines.push(`    // Event: ${event} → ${handler}`);
    lines.push(`    const ${handler}El = el.querySelector('[data-bodhi-on-${event}="${handler}"]');`);
    lines.push(`    if (${handler}El) {`);
    lines.push(`      ${handler}El.addEventListener('${event}', ${handler});`);
    lines.push(`      unsubs.push(() => ${handler}El.removeEventListener('${event}', ${handler}));`);
    lines.push('    }');
    lines.push('');
  }

  lines.push('    return () => unsubs.forEach(fn => fn());');
  lines.push('  });');
  lines.push('}');

  return lines.join('\n');
}
