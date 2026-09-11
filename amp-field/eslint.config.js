// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'coverage/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Semantic design tokens only: hard-coded colours are a design-system bug.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6,8})$/]',
          message: 'Use a semantic design token from @/theme instead of a hard-coded colour.',
        },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The palette and Expo config are the only places raw colours may appear.
    files: ['theme/palette.ts', 'theme/tokens.ts', 'app.config.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]);
