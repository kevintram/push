type AppEnvironment = {
	VITE_CLERK_PUBLISHABLE_KEY?: string
	VITE_CONVEX_URL?: string
}

type AppConfig = {
	clerk: {
		publishableKey: string
	}
	convex: {
		url: string
	}
}

function requireValue(environment: AppEnvironment, key: keyof AppEnvironment) {
	const value = environment[key]?.trim()

	if (!value) {
		throw new Error(`Missing required configuration: ${key}`)
	}

	return value
}

export function readConfig(environment: AppEnvironment): AppConfig {
	return {
		clerk: {
			publishableKey: requireValue(
				environment,
				'VITE_CLERK_PUBLISHABLE_KEY',
			),
		},
		convex: {
			url: requireValue(environment, 'VITE_CONVEX_URL'),
		},
	}
}

// Vite embeds VITE_* values in the browser bundle; never put secrets here.
export const config = readConfig({
	VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
	VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
})
