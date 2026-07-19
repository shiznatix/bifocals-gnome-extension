import tseslint from 'typescript-eslint';

export default tseslint.config(
	...tseslint.configs.recommended,
	{
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-trailing-spaces': 'error',
			'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
			'eol-last': ['error', 'always'],
			'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
			'no-irregular-whitespace': 'error',
		},
	},
);
