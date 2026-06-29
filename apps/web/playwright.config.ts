import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { defineConfig, devices } from '@playwright/test'

const configDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(configDir, '..', '..')
const worktreeEnvPath = resolve(repoRoot, '.worktree.env')
const webPortPattern = /^WEB_PORT=(\d+)$/mu

function resolveWebPort() {
	const envPort = Number.parseInt(process.env.WEB_PORT ?? '', 10)
	if (Number.isFinite(envPort) && envPort > 0) {
		return envPort
	}

	try {
		const worktreeEnv = readFileSync(worktreeEnvPath, 'utf8')
		const match = worktreeEnv.match(webPortPattern)
		if (match?.[1]) {
			return Number.parseInt(match[1], 10)
		}
	} catch {
		// Fall back to default web port when .worktree.env is unavailable.
	}

	return 5173
}

const webPort = resolveWebPort()
const webUrl = `http://localhost:${webPort}`
// Set PLAYWRIGHT_DISABLE_WEBSERVER=1 when a dev server is already running (e.g. via run.sh).
const shouldManageWebServer = process.env.PLAYWRIGHT_DISABLE_WEBSERVER !== '1'

export default defineConfig({
	forbidOnly: !!process.env.CI,
	fullyParallel: true,
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
	],
	reporter: 'html',
	retries: process.env.CI ? 2 : 0,
	testDir: './e2e/tests',
	use: {
		baseURL: webUrl,
		trace: 'on-first-retry',
	},
	webServer: shouldManageWebServer
		? {
				command: `pnpm exec vite --host localhost --port ${webPort} --strictPort`,
				reuseExistingServer: !process.env.CI,
				url: webUrl,
			}
		: undefined,
	workers: process.env.CI ? 1 : undefined,
})
