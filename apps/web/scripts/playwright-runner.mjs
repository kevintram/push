#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const currentMajor = Number.parseInt(
	process.versions.node.split('.')[0] ?? '',
	10
)
const useNode22Shim = Number.isFinite(currentMajor) && currentMajor > 22

const scriptDir = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(scriptDir, '..')
const playwrightCliPath = resolve(
	webRoot,
	'node_modules/@playwright/test/cli.js'
)

const args = process.argv.slice(2)

const command = useNode22Shim ? 'npx' : process.execPath
const commandArgs = useNode22Shim
	? ['-y', 'node@22', playwrightCliPath, ...args]
	: [playwrightCliPath, ...args]

const env = { ...process.env }

if (useNode22Shim) {
	env.npm_config_dir = undefined
	env.npm_config_verify_deps_before_run = undefined
	env.npm_config__jsr_registry = undefined
}

const result = spawnSync(command, commandArgs, {
	cwd: webRoot,
	stdio: 'inherit',
	env
})

if (result.error) {
	throw result.error
}

process.exit(result.status ?? 1)
