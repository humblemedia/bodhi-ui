/**
 * Bodhi Component Spec Schema Validation
 *
 * Validates parsed YAML component specs against the Yantra/Mudra schema.
 */

import { resolveYantra, resolveMudra } from '@bodhi/tokens';

const VALID_EVENTS = ['click', 'input', 'change', 'keydown', 'keyup', 'focus', 'blur', 'submit'];

/**
 * Validate a component spec node (and its children recursively).
 * Returns an array of error strings. Empty array = valid.
 */
export function validate(node, path = 'root') {
  const errors = [];

  if (!node || typeof node !== 'object') {
    errors.push(`${path}: spec must be an object`);
    return errors;
  }

  // Yantra is required
  if (!node.yantra) {
    errors.push(`${path}: missing required "yantra" field`);
  } else {
    try {
      resolveYantra(node.yantra);
    } catch {
      errors.push(`${path}: unknown yantra "${node.yantra}"`);
    }
  }

  // Mudras are optional but must be valid
  if (node.mudras) {
    if (!Array.isArray(node.mudras)) {
      errors.push(`${path}: "mudras" must be an array`);
    } else {
      for (const m of node.mudras) {
        try {
          resolveMudra(m);
        } catch {
          errors.push(`${path}: unknown mudra "${m}"`);
        }
      }
    }
  }

  // Event handlers must reference valid events
  if (node.on) {
    if (typeof node.on !== 'object') {
      errors.push(`${path}: "on" must be an object`);
    } else {
      for (const event of Object.keys(node.on)) {
        if (!VALID_EVENTS.includes(event)) {
          errors.push(`${path}: unknown event "${event}" in "on"`);
        }
      }
    }
  }

  // Validate children recursively
  if (node.children) {
    if (!Array.isArray(node.children)) {
      errors.push(`${path}: "children" must be an array`);
    } else {
      node.children.forEach((child, i) => {
        const childPath = `${path}.children[${i}]`;
        errors.push(...validate(child, childPath));
      });
    }
  }

  // Validate views (like children but with id)
  if (node.views) {
    if (!Array.isArray(node.views)) {
      errors.push(`${path}: "views" must be an array`);
    } else {
      node.views.forEach((view, i) => {
        const viewPath = `${path}.views[${i}]`;
        if (!view.id) {
          errors.push(`${viewPath}: view missing required "id" field`);
        }
        errors.push(...validate(view, viewPath));
      });
    }
  }

  return errors;
}
