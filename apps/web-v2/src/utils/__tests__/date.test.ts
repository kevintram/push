import { DateTime, Settings } from 'luxon'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DateString } from '~/types/date'
import {
	formatAbsoluteDate,
	formatRelativeDate,
	getDateTone,
	todayIso,
} from '~/utils/date'

describe('date', () => {
	const today: DateString = '2026-07-20'
	const originalZone = Settings.defaultZone

	afterEach(() => {
		Settings.defaultZone = originalZone
		vi.useRealTimers()
	})

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
		['Pacific/Kiritimati', '2026-07-20'],
		['Pacific/Midway', '2026-07-19'],
	] as const)('uses the local day in %s', (zone, expected) => {
		vi.useFakeTimers()
		vi.setSystemTime(DateTime.fromISO('2026-07-19T12:30:00Z').toJSDate())
		Settings.defaultZone = zone

		expect(todayIso()).toBe(expected)
	})

	// A DST transition makes one local day 23 or 25 hours long, so a day count
	// computed by dividing elapsed time would land off by a fraction here.
	it.each([
		// 2026-11-01 ends daylight saving in New York, so it lasts 25 hours.
		['2026-11-02', '2026-11-01', 'Tomorrow'],
		['2026-11-01', '2026-11-02', 'Yesterday'],
		// 2026-03-08 starts it, so it lasts 23 hours.
		['2026-03-09', '2026-03-08', 'Tomorrow'],
		['2026-03-15', '2026-03-08', 'in 7d'],
		['2026-03-08', '2026-03-15', '7d ago'],
	])(
		'reads %s from %s as %s across a DST transition',
		(value, today, expected) => {
			Settings.defaultZone = 'America/New_York'

			expect(
				formatRelativeDate(value as DateString, today as DateString),
			).toBe(expected)
		},
	)

	it('reads a same-day comparison as today in an extreme offset', () => {
		Settings.defaultZone = 'Pacific/Kiritimati'

		expect(formatRelativeDate('2026-07-20', '2026-07-20')).toBe('Today')
		expect(formatRelativeDate('2026-07-25', '2026-07-20')).toBe('in 5d')
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
