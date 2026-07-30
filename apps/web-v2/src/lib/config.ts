type AppEnvironment = {
	VITE_CONVEX_URL?: string
	VITE_WORKOS_CLIENT_ID?: string
	VITE_WORKOS_REDIRECT_URI?: string
}

type AppConfig = {
	convex: {
		url: string
	}
	workOs: {
		clientId: string
		redirectUri: string
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
		convex: {
			url: requireValue(environment, 'VITE_CONVEX_URL'),
		},
		workOs: {
			clientId: requireValue(environment, 'VITE_WORKOS_CLIENT_ID'),
			redirectUri: requireValue(environment, 'VITE_WORKOS_REDIRECT_URI'),
		},
	}
}

// Vite embeds VITE_* values in the browser bundle; never put secrets here.
export const config = readConfig({
	VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
	VITE_WORKOS_CLIENT_ID: import.meta.env.VITE_WORKOS_CLIENT_ID,
	VITE_WORKOS_REDIRECT_URI: import.meta.env.VITE_WORKOS_REDIRECT_URI,
})
