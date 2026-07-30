type PublicAuthEnvironment = {
	VITE_CONVEX_URL?: string
	VITE_WORKOS_CLIENT_ID?: string
	VITE_WORKOS_REDIRECT_URI?: string
}

type PublicAuthConfig = {
	convexUrl: string
	workOsClientId: string
	workOsRedirectUri: string
}

function requirePublicValue(
	environment: PublicAuthEnvironment,
	key: keyof PublicAuthEnvironment,
) {
	const value = environment[key]?.trim()

	if (!value) {
		throw new Error(`Missing required public configuration: ${key}`)
	}

	return value
}

export function readPublicAuthConfig(
	environment: PublicAuthEnvironment,
): PublicAuthConfig {
	return {
		convexUrl: requirePublicValue(environment, 'VITE_CONVEX_URL'),
		workOsClientId: requirePublicValue(
			environment,
			'VITE_WORKOS_CLIENT_ID',
		),
		workOsRedirectUri: requirePublicValue(
			environment,
			'VITE_WORKOS_REDIRECT_URI',
		),
	}
}
