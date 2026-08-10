import { describe, expect, it } from 'vitest'

import { assertNonNull } from './assertNonNull'

describe('assertNonNull', () => {
	it('returns non-nullish values', () => {
		expect(assertNonNull(0, 'missing value')).toBe(0)
	})

	it.each([null, undefined])('rejects %s', value => {
		expect(() => assertNonNull(value, 'missing value')).toThrow(
			'missing value',
		)
	})
})
