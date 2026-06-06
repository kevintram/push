/// <reference types="vitest/config" />

import { execSync } from 'node:child_process'
import path from 'node:path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const branchName = (() => {
	try {
		return execSync('git rev-parse --abbrev-ref HEAD', {
			encoding: 'utf-8'
		}).trim()
	} catch {}
})()

export default defineConfig(() => ({
	plugins: [
		tsconfigPaths(),
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true,
			routesDirectory: './src/app/routes',
			generatedRouteTree: './src/app/routeTree.gen.ts'
		}),
		vanillaExtractPlugin(),
		react()
	],
	define: {
		__APP_BRANCH__: JSON.stringify(branchName ?? '')
	},
	resolve: {
		alias: {
			'~': path.resolve(import.meta.dirname, './src')
		}
	},
	test: {
		bail: 1,
		clearMocks: true,
		coverage: {
			enabled: true,
			exclude: [
				'src/**/*.css.ts',
				'src/**/*.d.ts',
				'src/main.tsx',
				'src/testing/**',
				'src/app/routeTree.gen.ts'
			],
			include: ['src/**/*'],
			reporter: ['text', 'lcov'],
			reportsDirectory: 'coverage'
		},
		css: false,
		environment: 'happy-dom',
		globals: true,
		include: ['src/**/__tests__/**/*.test.ts?(x)'],
		setupFiles: 'src/testing/setup-tests.ts'
	}
}))
