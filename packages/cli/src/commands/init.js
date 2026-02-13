/**
 * bodhi init — Scaffold a Bodhi project.
 *
 * Creates:
 *   - bodhi.config.js (project configuration)
 *   - bodhi.rupa.json (default brand token file)
 *   - eslint.config.js (with Bodhi plugin configured)
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DEFAULT_CONFIG = `/**
 * Bodhi Configuration
 * @see https://github.com/yourusername/bodhi
 */
export default {
  // Enforcement mode: 'dogmatic' blocks builds, 'lenient' flags for review
  mode: 'dogmatic',

  // Interface mode for linter messages: 'poetic', 'semantic', or 'raw'
  interfaceMode: 'poetic',

  // Path to your brand Rūpa file
  rupa: './bodhi.rupa.json',

  // Compile target
  target: 'wordpress',

  // Markers to enable (all nine by default)
  markers: [
    'M1', // Manufactured Urgency
    'M2', // Obstructed Exit
    'M3', // Attention Capture
    'M4', // Consent Erosion
    'M5', // False Social Proof
    'M6', // Cognitive Overload
    'M7', // Asymmetric Salience
    'M8', // Anchoring Manipulation
    'M9', // Enforced Continuity
  ],
};
`;

const DEFAULT_RUPA = JSON.stringify(
  {
    $schema: 'https://bodhi.dev/schema/rupa-v1.json',
    name: 'Default Brand',
    version: '1.0.0',
    varna: {
      primary: '#2563eb',
      secondary: '#64748b',
      surface: '#ffffff',
      'surface-alt': '#f8fafc',
      text: '#0f172a',
      'text-muted': '#64748b',
      danger: '#dc2626',
      success: '#16a34a',
      warning: '#d97706',
      focus: '#2563eb',
    },
    lipi: {
      family: {
        body: 'system-ui, -apple-system, sans-serif',
        heading: 'system-ui, -apple-system, sans-serif',
        mono: 'ui-monospace, monospace',
      },
      scale: {
        japa: '0.75rem',
        katha: '1rem',
        ghosana: '1.5rem',
      },
    },
    akasa: {
      sparsa: '0.125rem',
      svasa: '0.5rem',
      vicara: '1rem',
      vistara: '2rem',
    },
    pramana: {
      'content-max': '65ch',
      'page-max': '1200px',
    },
    sima: {
      width: '1px',
      radius: '0.375rem',
      'radius-full': '9999px',
      'focus-ring': '2px solid var(--bodhi-varna-focus)',
    },
    chaya: {
      sm: '0 1px 2px rgba(0,0,0,0.05)',
      md: '0 4px 6px rgba(0,0,0,0.1)',
      lg: '0 10px 15px rgba(0,0,0,0.1)',
    },
    calana: {
      duration: '150ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  null,
  2,
);

const ESLINT_CONFIG = `import bodhi from 'eslint-plugin-bodhi';

export default [
  bodhi.configs.recommended,
  {
    files: ['**/*.jsx', '**/*.tsx'],
  },
];
`;

export async function init(options) {
  const dir = options.dir || '.';

  console.log('');
  console.log('  बोधि — Awakening for the web.');
  console.log('');

  // Create bodhi.config.js
  const configPath = join(dir, 'bodhi.config.js');
  if (existsSync(configPath)) {
    console.log('  ⚠ bodhi.config.js already exists, skipping.');
  } else {
    writeFileSync(configPath, DEFAULT_CONFIG);
    console.log('  ✓ Created bodhi.config.js');
  }

  // Create bodhi.rupa.json
  const rupaPath = join(dir, 'bodhi.rupa.json');
  if (existsSync(rupaPath)) {
    console.log('  ⚠ bodhi.rupa.json already exists, skipping.');
  } else {
    writeFileSync(rupaPath, DEFAULT_RUPA);
    console.log('  ✓ Created bodhi.rupa.json (default brand tokens)');
  }

  // Create eslint.config.js if not present
  const eslintPath = join(dir, 'eslint.config.js');
  if (existsSync(eslintPath)) {
    console.log('  ⚠ eslint.config.js already exists — add Bodhi manually:');
    console.log('');
    console.log("    import bodhi from 'eslint-plugin-bodhi';");
    console.log('    // Add bodhi.configs.recommended to your config array');
    console.log('');
  } else {
    writeFileSync(eslintPath, ESLINT_CONFIG);
    console.log('  ✓ Created eslint.config.js with Bodhi plugin');
  }

  console.log('');
  console.log('  Next steps:');
  console.log('    1. Edit bodhi.rupa.json with your brand tokens');
  console.log('    2. Run: bodhi lint src/');
  console.log('    3. Run: bodhi token compile');
  console.log('');
  console.log('  The interface cares about users. Now so does your linter.');
  console.log('');
}
