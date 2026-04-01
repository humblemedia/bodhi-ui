/**
 * bodhi compile <spec> — Compile a Bodhi YAML component spec
 *
 * Reads a .bodhi.yaml file, validates it against the Yantra/Mudra schema,
 * and emits semantic HTML + CSS + JS to the output directory.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { compile } from '@bodhi/compiler';

export function compileCommand(spec, options) {
  const specPath = resolve(spec);
  const outputDir = resolve(options.output || 'dist');

  // Read spec
  let yamlContent;
  try {
    yamlContent = readFileSync(specPath, 'utf8');
  } catch (err) {
    console.error(`Error reading spec: ${specPath}`);
    console.error(err.message);
    process.exit(1);
  }

  // Compile
  const result = compile(yamlContent, { js: options.js !== false });

  // Report errors
  if (result.errors.length > 0) {
    console.error('Compilation errors:');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  // Write output
  mkdirSync(outputDir, { recursive: true });
  const name = basename(specPath, '.bodhi.yaml');

  writeFileSync(resolve(outputDir, `${name}.html`), result.html, 'utf8');
  console.log(`  HTML → ${name}.html`);

  writeFileSync(resolve(outputDir, `${name}.css`), result.css, 'utf8');
  console.log(`  CSS  → ${name}.css`);

  if (result.js) {
    writeFileSync(resolve(outputDir, `${name}.js`), result.js, 'utf8');
    console.log(`  JS   → ${name}.js`);
  }

  console.log(`Compiled ${basename(specPath)} → ${outputDir}/`);
}
