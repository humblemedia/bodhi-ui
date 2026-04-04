import bodhi from 'eslint-plugin-bodhi';

export default [
  bodhi.configs.recommended,
  {
    files: ['src/cetana/*.js', 'src/workers/*.js'],
  },
  {
    ignores: ['dist/'],
  },
];
