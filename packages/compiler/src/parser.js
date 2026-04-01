/**
 * Bodhi YAML Parser
 *
 * Parses .bodhi.yaml component specs and validates against schema.
 */

import { parse as parseYaml } from 'yaml';
import { validate } from './schema.js';

/**
 * Parse a YAML string into a validated component spec.
 *
 * @param {string} yamlString - Raw YAML content
 * @returns {{ spec: object, errors: string[] }}
 */
export function parse(yamlString) {
  let spec;
  try {
    spec = parseYaml(yamlString);
  } catch (err) {
    return { spec: null, errors: [`YAML parse error: ${err.message}`] };
  }

  if (!spec || typeof spec !== 'object') {
    return { spec: null, errors: ['YAML must contain an object at root level'] };
  }

  const errors = validate(spec);
  return { spec, errors };
}
