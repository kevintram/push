/// <reference types="vitest/config" />

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => ({
	plugins: [
		tsconfigPaths(),
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true
		}),
		react(),
		tailwindcss()
	],
	test: {
		bail: 1,
		clearMocks: true,
		coverage: {
			enabled: true,
			exclude: ['src/main.tsx', 'src/mocks/browser.ts', 'src/test-utils.tsx'],
			include: ['src/**/*'],
			reporter: ['text', 'lcov'],
			reportsDirectory: 'coverage',
			thresholds: {
				lines: 85,
				functions: 85,
				branches: 85,
				statements: 85
			}
		},
		css: false,
		environment: 'happy-dom',
		globals: true,
		include: ['src/**/*.test.ts?(x)'],
		setupFiles: 'src/test-setup.ts'
	}
}))
