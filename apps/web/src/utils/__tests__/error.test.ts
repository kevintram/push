import { ConvexError } from 'convex/values'
import { describe, expect, it } from 'vitest'

import { getErrorMessage } from '../error'

describe('getErrorMessage', () => {
	it('returns the message of a ConvexError', () => {
		expect(getErrorMessage(new ConvexError('Card not found'))).toBe(
			'Card not found',
		)
	})

	it('hides the message of any other error', () => {
		expect(getErrorMessage(new Error('Server Error'))).toBeUndefined()
		expect(getErrorMessage('Request failed')).toBeUndefined()
		expect(getErrorMessage(new ConvexError({ code: 1 }))).toBeUndefined()
	})
})
