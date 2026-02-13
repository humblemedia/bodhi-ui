/**
 * bodhi lint — Run design ethics markers against code.
 *
 * Wraps ESLint with the Bodhi plugin pre-configured.
 * This is the command that makes `npx bodhi lint` work.
 */

import { execSync } from 'child_process';

export async function lint(files, options) {
  const mode = options.mode || 'dogmatic';
  const interfaceMode = options.interface || 'poetic';

  console.log('');
  console.log(`  बोधि lint — ${mode} mode, ${interfaceMode} messages`);
  console.log('');

  // Build ESLint command
  let fileGlobs;
  if (files.length > 0) {
    fileGlobs = files.join(' ');
  } else {
    fileGlobs = '"**/*.jsx" "**/*.tsx"';
  }
  const fixFlag = options.fix ? ' --fix' : '';

  try {
    // Delegate to ESLint with Bodhi plugin
    // In production, this would use the ESLint Node API directly.
    // For now, shell out to npx eslint.
    const cmd = `npx eslint ${fileGlobs}${fixFlag}`;
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    console.log('');
    console.log('  ✓ No design ethics violations found.');
    console.log('');
  } catch (error) {
    // ESLint exits with code 1 when violations found — that's expected
    if (error.status === 1) {
      console.log('');
      console.log('  Design ethics violations found. The interface asks for your attention.');
      console.log('');
    } else {
      console.error('  Error running ESLint:', error.message);
      process.exit(2);
    }
  }
}
