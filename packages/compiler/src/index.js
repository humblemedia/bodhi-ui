/**
 * Bodhi Semantic Compiler
 *
 * Public API: compile(yamlString, options) → { html, css, js }
 *
 * Takes YAML component specifications written in Bodhi's Yantra/Mudra
 * vocabulary and emits semantic HTML + CSS + JS.
 */

import { parse } from './parser.js';
import { emitHtml } from './emitters/html.js';
import { emitCss } from './emitters/css.js';
import { emitJs } from './emitters/js.js';

/**
 * Compile a Bodhi YAML component spec to HTML, CSS, and JS.
 *
 * @param {string} yamlString - Raw .bodhi.yaml content
 * @param {object} [options] - Compilation options
 * @param {boolean} [options.js=true] - Whether to emit JS (false for static-only)
 * @returns {{ html: string, css: string, js: string, errors: string[] }}
 */
export function compile(yamlString, options = {}) {
  const { js: emitJsFlag = true } = options;

  const { spec, errors } = parse(yamlString);

  if (errors.length > 0) {
    return { html: '', css: '', js: '', errors };
  }

  const html = emitHtml(spec);
  const css = emitCss(spec);
  const js = emitJsFlag ? emitJs(spec) : '';

  return { html, css, js, errors: [] };
}

export { parse } from './parser.js';
export { emitHtml } from './emitters/html.js';
export { emitCss } from './emitters/css.js';
export { emitJs } from './emitters/js.js';
export { validate } from './schema.js';
