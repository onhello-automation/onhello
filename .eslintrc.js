module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/type-annotation-spacing': ['error'],
		'array-bracket-spacing': ['error', 'never'],
		'arrow-spacing': ['error'],
		'comma-dangle': ['off', 'ignore'],
		'comma-spacing': ['error', { before: false, after: true }],
		indent: ['error', 'tab', { SwitchCase: 1 }],
		'key-spacing': ['error'],
		'keyword-spacing': ['error'],
		'no-tabs': 0,
		'object-curly-spacing': ['error', 'always'],
		'operator-linebreak': ['off'],
		quotes: ['off'],
		semi: ['error', 'never'],
		'space-before-function-paren': [2, {
			named: 'never',
			anonymous: 'always',
			asyncArrow: 'always'
		}],
		'space-in-parens': ['error', 'never'],
		'space-infix-ops': ['error', { int32Hint: false }],
	},
	env: {
		browser: true,
		node: true,
	},
}
