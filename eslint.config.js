import bodhi from './packages/eslint-plugin-bodhi/src/index.js';

export default [
  {
    files: ['**/*.jsx', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      bodhi,
    },
    rules: {
      'bodhi/no-manufactured-urgency': ['warn', { mode: 'lenient', interfaceMode: 'poetic' }],
      'bodhi/no-obstructed-exit': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-attention-capture': ['warn', { mode: 'lenient', interfaceMode: 'poetic' }],
      'bodhi/no-consent-erosion': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-false-social-proof': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-cognitive-overload': ['warn', { mode: 'lenient', interfaceMode: 'poetic' }],
      'bodhi/no-asymmetric-salience': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-anchoring-manipulation': ['warn', { mode: 'lenient', interfaceMode: 'poetic' }],
      'bodhi/no-enforced-continuity': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
    },
  },
];
