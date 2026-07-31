import { describe, expect, it } from 'vitest'

import { readConfig } from '../config'

const completeEnvironment = {
	VITE_CONVEX_URL: 'https://example.convex.cloud',
	VITE_WORKOS_CLIENT_ID: 'client_example',
	VITE_WORKOS_REDIRECT_URI: 'https://example.com/',
	VITE_WORKOS_SIGN_OUT_RETURN_TO: 'https://example.com',
}

describe('readConfig', () => {
	it('returns the required application configuration', () => {
		expect(readConfig(completeEnvironment)).toEqual({
			convex: {
				url: 'https://example.convex.cloud',
			},
			workOs: {
				clientId: 'client_example',
				redirectUri: 'https://example.com/',
				signOutReturnTo: 'https://example.com',
			},
		})
	})

	it.each([
		'VITE_CONVEX_URL',
		'VITE_WORKOS_CLIENT_ID',
		'VITE_WORKOS_REDIRECT_URI',
		'VITE_WORKOS_SIGN_OUT_RETURN_TO',
	] as const)('rejects a missing %s value', key => {
		expect(() =>
			readConfig({
				...completeEnvironment,
				[key]: ' ',
			}),
		).toThrowError(`Missing required configuration: ${key}`)
	})
})
