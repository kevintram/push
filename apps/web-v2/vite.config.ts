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
			useCSSLayers: {
				before: ['reset', 'vendor'],
			},
			aliases: {
				'~/*': [path.resolve(import.meta.dirname, './src/*')],
			},
		}),
		react(),
	],
	define: {
		__APP_BRANCH__: JSON.stringify(branchName ?? ''),
	},
	resolve: {
		alias: {
			'@convex': path.resolve(import.meta.dirname, './convex'),
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
				'convex/_generated/**',
				'convex/**/*.test.ts',
				'convex/test.setup.ts',
				'src/**/*.stylex.ts',
				'src/**/*.d.ts',
				'src/lib/convex.ts',
				'src/main.tsx',
				'src/testing/**',
				'src/app/routeTree.gen.ts',
			],
			include: ['convex/**/*.ts', 'src/**/*'],
			reporter: ['text', 'lcov'],
			reportsDirectory: 'coverage',
		},
		css: false,
		globals: true,
		projects: [
			{
				// `as const` keeps this from widening to `boolean`, which vitest
				// rejects: `extends` is typed `string | true`.
				extends: true as const,
				test: {
					environment: 'happy-dom',
					include: ['src/**/__tests__/**/*.test.ts?(x)'],
					name: 'frontend',
					setupFiles: 'src/testing/setup-tests.ts',
				},
			},
			{
				extends: true as const,
				test: {
					environment: 'edge-runtime',
					include: ['convex/**/*.test.ts'],
					name: 'convex',
				},
			},
		],
	},
}))
