/** @type {import('prettier').Config} */
export default {
	arrowParens: 'avoid',
	bracketSpacing: true,
	jsxSingleQuote: true,
	printWidth: 80,
	semi: false,
	singleQuote: true,
	tabWidth: 4,
	trailingComma: 'all',
	useTabs: true,
	overrides: [
		{
			files: 'src/components/ui/**/*.{ts,tsx}',
			options: {
				singleQuote: false,
			},
		},
		{
			files: '*.css',
			options: {
				singleQuote: false,
			},
		},
	],
}
