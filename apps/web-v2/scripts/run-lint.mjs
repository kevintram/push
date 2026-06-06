import { spawnSync } from 'node:child_process'
import process from 'node:process'

const lintSteps = ['lint:tsc', 'lint:biome', 'lint:component-count']

let hasFailure = false

for (const lintStep of lintSteps) {
	const result = spawnSync('pnpm', ['run', lintStep], {
		cwd: process.cwd(),
		stdio: 'inherit'
	})

	if (result.status !== 0) {
		hasFailure = true
	}
}

process.exit(hasFailure ? 1 : 0)
