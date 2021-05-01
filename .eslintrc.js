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
		'comma-dangle': ['off', 'ignore'],
		'comma-spacing': ["error", { "before": false, "after": true }],
		indent: ['error', 'tab', { SwitchCase: 1 }],
		'no-tabs': 0,
		'operator-linebreak': ['off'],
		quotes: ['off'],
		semi: ['error', 'never'],
		'space-before-function-paren': [2, {
			named: 'never',
			anonymous: 'always',
			asyncArrow: 'always'
		}],
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
	},
	env: {
		browser: true,
		node: true,
	},
}
