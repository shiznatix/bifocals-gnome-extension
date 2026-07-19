import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig({
	files: ['**/*.{js,ts}'],
	extends: [js.configs.recommended, tseslint.configs.recommended],
	rules: {
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'no-trailing-spaces': 'error',
		'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
		'eol-last': ['error', 'always'],
		'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
		'no-irregular-whitespace': 'error',
		semi: 'error',
	},
});
