/// <reference types="vitest/config" />

import { execSync } from 'node:child_process'
import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const branchName = (() => {
	try {
		return execSync('git rev-parse --abbrev-ref HEAD', {
			encoding: 'utf-8',
		}).trim()
	} catch {}
})()

export default defineConfig(() => ({
	plugins: [
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true,
			routesDirectory: './src/app/routes',
			generatedRouteTree: './src/app/routeTree.gen.ts',
			routeTreeFileHeader: [
				'/* oxlint-disable */',
				'// @ts-nocheck',
				'// noinspection JSUnusedGlobalSymbols',
			],
		}),
		react(),
		tailwindcss(),
	],
	define: {
		__APP_BRANCH__: JSON.stringify(branchName ?? ''),
	},
	resolve: {
		alias: {
			'~': path.resolve(import.meta.dirname, './src'),
		},
		tsconfigPaths: true,
	},
	test: {
		bail: 1,
		clearMocks: true,
		coverage: {
			enabled: true,
			exclude: ['src/main.tsx', 'src/testing/**', 'src/components/ui/**'],
			include: ['src/**/*'],
			reporter: ['text', 'lcov'],
			reportsDirectory: 'coverage',
			thresholds: {
				// TODO: deal with this later
				// lines: 85,
				// functions: 85,
				// branches: 85,
				// statements: 85
			},
		},
		css: false,
		environment: 'happy-dom',
		globals: true,
		include: ['src/**/__tests__/**/*.test.ts?(x)'],
		setupFiles: 'src/testing/setup-tests.ts',
	},
}))
