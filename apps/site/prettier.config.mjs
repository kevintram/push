/** @type {import('prettier').Config} */
export default {
	arrowParens: 'avoid',
	bracketSpacing: true,
	jsxSingleQuote: true,
	printWidth: 80,
	plugins: ['prettier-plugin-astro'],
	semi: false,
	singleQuote: true,
	tabWidth: 4,
	trailingComma: 'all',
	useTabs: true,
	overrides: [
		{
			files: '*.astro',
			options: {
				parser: 'astro',
			},
		},
	],
}
