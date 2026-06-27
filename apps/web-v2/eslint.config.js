// @ts-check
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

const unusedVarRule = [
	'error',
	{
		argsIgnorePattern: '^_',
		destructuredArrayIgnorePattern: '^_',
		varsIgnorePattern: '^_',
	},
]

export default tseslint.config(
	{
		ignores: [
			'coverage',
			'dist',
			'node_modules',
			'public',
			'src/app/routeTree.gen.ts',
		],
	},
	js.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			'no-empty': 'off',
			'no-unused-vars': unusedVarRule,
		},
	},
	{
		files: ['**/*.{js,mjs,cjs}'],
		languageOptions: {
			sourceType: 'module',
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		extends: [...tseslint.configs.recommended],
		plugins: {
			react,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			'simple-import-sort': simpleImportSort,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			...react.configs.flat.recommended.rules,
			...react.configs.flat['jsx-runtime'].rules,
			...reactHooks.configs.recommended.rules,
			'@typescript-eslint/array-type': ['warn', { default: 'generic' }],
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ prefer: 'type-imports', fixStyle: 'inline-type-imports' },
			],
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unused-vars': unusedVarRule,
			'@typescript-eslint/require-await': 'off',
			'react-hooks/rules-of-hooks': 'error',
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true },
			],
			'react/no-unescaped-entities': 'off',
			'react/prop-types': 'off',
			'simple-import-sort/exports': 'error',
			'simple-import-sort/imports': 'error',
		},
	},
	{
		files: ['src/**/*.test.{ts,tsx}', 'src/testing/**/*.{ts,tsx}'],
		rules: {
			'@typescript-eslint/consistent-type-imports': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{
		files: ['vite.config.ts', 'scripts/**/*.mjs'],
		rules: {},
	},
	{
		files: ['src/**/*.css.ts'],
		rules: {
			'react-refresh/only-export-components': 'off',
		},
	},
	{
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
	},
)
