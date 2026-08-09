import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'artifacts/**', 'fixtures/**/*.jsonl'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: { console: 'readonly', process: 'readonly', window: 'readonly', document: 'readonly', Buffer: 'readonly' } } },
  { files: ['**/*.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
);
