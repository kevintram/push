import { describe, expect, it } from 'vitest'

import { readPublicAuthConfig } from '../authConfig'

const completeEnvironment = {
	VITE_CONVEX_URL: 'https://example.convex.cloud',
	VITE_WORKOS_CLIENT_ID: 'client_example',
	VITE_WORKOS_REDIRECT_URI: 'https://example.com/callback',
}

describe('readPublicAuthConfig', () => {
	it('returns the required public authentication configuration', () => {
		expect(readPublicAuthConfig(completeEnvironment)).toEqual({
			convexUrl: 'https://example.convex.cloud',
			workOsClientId: 'client_example',
			workOsRedirectUri: 'https://example.com/callback',
		})
	})

	it.each([
		'VITE_CONVEX_URL',
		'VITE_WORKOS_CLIENT_ID',
		'VITE_WORKOS_REDIRECT_URI',
	] as const)('rejects a missing %s value', key => {
		expect(() =>
			readPublicAuthConfig({
				...completeEnvironment,
				[key]: ' ',
			}),
		).toThrowError(`Missing required public configuration: ${key}`)
	})
})
