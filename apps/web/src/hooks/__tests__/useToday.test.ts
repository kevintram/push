import { act, renderHook } from '@testing-library/react'
import { DateTime, Settings } from 'luxon'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useToday } from '../useToday'

describe('useToday', () => {
	const originalZone = Settings.defaultZone

	afterEach(() => {
		Settings.defaultZone = originalZone
		vi.restoreAllMocks()
		vi.useRealTimers()
	})

	it('updates after local midnight', () => {
		vi.useFakeTimers()
		Settings.defaultZone = 'America/New_York'
		vi.setSystemTime(
			DateTime.fromISO('2026-08-09T23:59:59.900', {
				zone: 'America/New_York',
			}).toJSDate(),
		)

		const { result } = renderHook(() => useToday())
		expect(result.current).toBe('2026-08-09')

		act(() => vi.advanceTimersByTime(250))

		expect(result.current).toBe('2026-08-10')
	})

	it('uses one instant to refresh and schedule at the midnight boundary', () => {
		vi.useFakeTimers()
		Settings.defaultZone = 'America/New_York'
		const beforeMidnight = DateTime.fromISO('2026-08-09T23:59:59.999', {
			zone: 'America/New_York',
		})
		const afterMidnight = DateTime.fromISO('2026-08-10T00:00:00.001', {
			zone: 'America/New_York',
		})
		if (!beforeMidnight.isValid || !afterMidnight.isValid) {
			throw new Error('Expected valid test dates')
		}
		vi.spyOn(DateTime, 'now')
			.mockReturnValueOnce(beforeMidnight)
			.mockReturnValue(afterMidnight)

		const { result } = renderHook(() => useToday())
		expect(result.current).toBe('2026-08-09')

		act(() => vi.advanceTimersByTime(101))

		expect(result.current).toBe('2026-08-10')
	})

	it.each(['focus', 'pageshow'])(
		'refreshes on %s after a system timezone change',
		event => {
			vi.useFakeTimers()
			vi.setSystemTime(
				DateTime.fromISO('2026-08-09T12:00:00Z').toJSDate(),
			)
			Settings.defaultZone = 'Pacific/Midway'

			const { result } = renderHook(() => useToday())
			expect(result.current).toBe('2026-08-09')

			Settings.defaultZone = 'Pacific/Kiritimati'
			act(() => window.dispatchEvent(new Event(event)))

			expect(result.current).toBe('2026-08-10')
		},
	)

	it('stops scheduling work after the last subscriber unmounts', () => {
		vi.useFakeTimers()
		vi.setSystemTime(DateTime.fromISO('2026-08-09T12:00:00Z').toJSDate())

		const { unmount } = renderHook(() => useToday())
		expect(vi.getTimerCount()).toBe(1)

		unmount()
		expect(vi.getTimerCount()).toBe(0)
	})
})
