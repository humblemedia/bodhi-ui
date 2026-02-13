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
      'bodhi/no-consent-erosion': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-obstructed-exit': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
      'bodhi/no-asymmetric-salience': ['error', { mode: 'dogmatic', interfaceMode: 'poetic' }],
    },
  },
];