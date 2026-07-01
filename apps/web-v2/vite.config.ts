/// <reference types="vitest/config" />

import { execSync } from 'node:child_process'
import path from 'node:path'

import stylex from '@stylexjs/unplugin'
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
		stylex.vite({
			useCSSLayers: true,
		}),
		react(),
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
		// vite#18224: a plugin re-arms a file watcher after server.close() during
		// late async transforms (e.g. lazy route chunks), leaking a native handle
		// that keeps the process alive. Tests pass, so force-exit after 1s instead
		// of waiting out the 10s default.
		teardownTimeout: 1000,
		clearMocks: true,
		coverage: {
			enabled: true,
			exclude: [
				'src/**/*.stylex.ts',
				'src/**/*.d.ts',
				'src/main.tsx',
				'src/testing/**',
				'src/app/routeTree.gen.ts',
			],
			include: ['src/**/*'],
			reporter: ['text', 'lcov'],
			reportsDirectory: 'coverage',
		},
		css: false,
		environment: 'happy-dom',
		globals: true,
		include: ['src/**/__tests__/**/*.test.ts?(x)'],
		setupFiles: 'src/testing/setup-tests.ts',
	},
}))
