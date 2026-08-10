import { Settings } from 'luxon'
import { afterEach, describe, expect, it } from 'vitest'

import { assertIsoDate } from './date'

describe('assertIsoDate', () => {
	const originalZone = Settings.defaultZone

	afterEach(() => {
		Settings.defaultZone = originalZone
	})

	// Pacific/Apia jumped the date line in 2011 and skipped 2011-12-30 outright,
	// so a local-zone parse of that day silently lands on the 31st.
	it('accepts a day that does not exist in the process timezone', () => {
		Settings.defaultZone = 'Pacific/Apia'

		expect(() => assertIsoDate('2011-12-30')).not.toThrow()
	})

	it.each(['2026-08-09', '2024-02-29', '0001-01-01'])(
		'accepts the canonical date %s',
		value => {
			expect(() => assertIsoDate(value)).not.toThrow()
		},
	)

	it.each([
		'2026-02-29',
		'2026-13-01',
		'2026-8-9',
		'+012345-01-01',
		'2026-08-09T00:00:00Z',
		'2026-08-09 trailing',
	])('rejects the non-canonical date %s', value => {
		expect(() => assertIsoDate(value)).toThrow('Invalid date-only value')
	})
})
