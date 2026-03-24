import { describe, expect, it } from 'vitest'
import { AuthRedirectError } from '../apiFetch'
import { createAppQueryClient, shouldRetryQuery } from '../queryClient'

describe('queryClient', () => {
	it('does not retry auth redirect errors', () => {
		expect(shouldRetryQuery(0, new AuthRedirectError())).toBe(false)
	})

	it('preserves standard retry behavior for other errors', () => {
		expect(shouldRetryQuery(0, new Error('boom'))).toBe(true)
		expect(shouldRetryQuery(2, new Error('boom'))).toBe(true)
		expect(shouldRetryQuery(3, new Error('boom'))).toBe(false)
	})

	it('configures the shared query client to use the retry policy', () => {
		const queryClient = createAppQueryClient()
		const retry = queryClient.getDefaultOptions().queries?.retry

		expect(retry).toBe(shouldRetryQuery)
	})
})
