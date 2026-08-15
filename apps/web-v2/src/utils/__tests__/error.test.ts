import { describe, expect, it } from 'vitest'

import { getErrorMessage } from '../error'

describe('getErrorMessage', () => {
	it('returns the message from an Error', () => {
		expect(getErrorMessage(new Error('Request failed'))).toBe(
			'Request failed',
		)
	})

	it('returns string errors unchanged', () => {
		expect(getErrorMessage('Request failed')).toBe('Request failed')
	})

	it('returns a fallback for other values', () => {
		expect(getErrorMessage(null)).toBe('An unexpected error occurred.')
	})
})
