import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'

import type { DateString } from '~/types/date'
import {
	formatAbsoluteDate,
	formatRelativeDate,
	getDateTone,
} from '~/utils/date'

describe('date', () => {
	const today = DateTime.local(2026, 7, 20)

	it.each([
		[null, 'Unscheduled'],
		['2026-07-20', 'Today'],
		['2026-07-21', 'Tomorrow'],
		['2026-07-19', 'Yesterday'],
		['2026-07-15', '5d ago'],
		['2026-07-24', 'in 4d'],
	] as Array<[DateString | null, string]>)(
		'formats %s as %s',
		(value, expected) => {
			expect(formatRelativeDate(value, today)).toBe(expected)
		},
	)

	it('formats an absolute date without shifting time zones', () => {
		expect(formatAbsoluteDate('2026-07-18')).toBe('Jul 18, 2026')
	})

	it.each([
		['2026-07-19', false, 'overdue'],
		['2026-07-19', true, 'default'],
		['2026-07-20', false, 'today'],
		['2026-07-20', true, 'today'],
		['2026-07-21', false, 'default'],
		[null, false, 'default'],
	] as const)(
		'uses the %s date tone when completion is %s',
		(value, isCompleted, expected) => {
			expect(getDateTone(value, isCompleted, today)).toBe(expected)
		},
	)
})
