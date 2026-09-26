import { describe, expect, it } from 'vitest'

import { readConfig } from '../config'

const completeEnvironment = {
	VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_example',
	VITE_CONVEX_URL: 'https://example.convex.cloud',
}

describe('readConfig', () => {
	it('returns the required application configuration', () => {
		expect(readConfig(completeEnvironment)).toEqual({
			clerk: {
				publishableKey: 'pk_test_example',
			},
			convex: {
				url: 'https://example.convex.cloud',
			},
		})
	})

	it.each(['VITE_CLERK_PUBLISHABLE_KEY', 'VITE_CONVEX_URL'] as const)(
		'rejects a missing %s value',
		key => {
			expect(() =>
				readConfig({
					...completeEnvironment,
					[key]: ' ',
				}),
			).toThrowError(`Missing required configuration: ${key}`)
		},
	)
})
