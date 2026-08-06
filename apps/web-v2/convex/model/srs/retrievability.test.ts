import { describe, expect, it } from 'vitest'

import {
	calculateDaysInCurrentTier,
	calculateRetrievability,
	computeDistanceToRetrievability,
	FINE_THRESHOLD,
	FRESH_THRESHOLD,
	getCurrentTierEntryThreshold,
	getFreshnessTier,
	getNextTierThreshold,
	HAZY_THRESHOLD,
	SRS_DECAY,
	SRS_FACTOR,
} from './retrievability'

const TODAY = '2026-02-16'

function daysToReach(stability: number, target: number): number {
	return ((target ** (1 / SRS_DECAY) - 1) * stability) / SRS_FACTOR
}

function daysBeforeToday(days: number): string {
	const date = new Date(`${TODAY}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() - days)
	return date.toISOString().slice(0, 10)
}

describe('calculateRetrievability', () => {
	it('returns null when persisted SRS state is incomplete', () => {
		expect(calculateRetrievability(null, TODAY, TODAY)).toBeNull()
		expect(calculateRetrievability(10, undefined, TODAY)).toBeNull()
	})

	it('uses UTC calendar days and the FSRS forgetting curve', () => {
		expect(calculateRetrievability(10, TODAY, TODAY)).toBe(1)
		expect(calculateRetrievability(10, '2026-02-15', TODAY)).toBeCloseTo(
			0.9856824087775146,
			14,
		)
		expect(calculateRetrievability(10, '2026-02-11', TODAY)).toBeCloseTo(
			0.9403442888929227,
			14,
		)
	})

	it('clamps a future review date to zero elapsed days', () => {
		expect(calculateRetrievability(10, '2026-02-17', TODAY)).toBe(1)
	})
})

describe('freshness thresholds', () => {
	it.each([
		[null, null],
		[0.5, 'Forgotten'],
		[HAZY_THRESHOLD, 'Forgotten'],
		[0.8, 'Hazy'],
		[FINE_THRESHOLD, 'Hazy'],
		[0.9, 'Fine'],
		[FRESH_THRESHOLD, 'Fine'],
		[0.98, 'Fresh'],
	] as const)('maps %s to %s', (retrievability, tier) => {
		expect(getFreshnessTier(retrievability)).toBe(tier)
	})

	it.each([
		[null, null],
		[0.5, null],
		[0.8, HAZY_THRESHOLD],
		[0.9, FINE_THRESHOLD],
		[0.98, FRESH_THRESHOLD],
	] as const)(
		'finds the next threshold for %s',
		(retrievability, threshold) => {
			expect(getNextTierThreshold(retrievability)).toBe(threshold)
		},
	)

	it.each([
		[null, null],
		[0.98, null],
		[0.9, FRESH_THRESHOLD],
		[0.8, FINE_THRESHOLD],
		[0.5, HAZY_THRESHOLD],
	] as const)(
		'finds the current-tier entry threshold for %s',
		(retrievability, threshold) => {
			expect(getCurrentTierEntryThreshold(retrievability)).toBe(threshold)
		},
	)
})

describe('calculateDaysInCurrentTier', () => {
	it('returns null when an input is missing', () => {
		expect(calculateDaysInCurrentTier(null, TODAY, 0.9, TODAY)).toBeNull()
		expect(calculateDaysInCurrentTier(10, null, 0.9, TODAY)).toBeNull()
		expect(calculateDaysInCurrentTier(10, TODAY, null, TODAY)).toBeNull()
	})

	it.each([
		[10, 0, 0],
		[50, 1, 1],
		[20, 9, 1],
		[30, 34, 22],
		[20, 39, 1],
		[20, 43, 5],
		[10, 65, 10],
	] as const)(
		'calculates tier age for stability %s after %s elapsed days',
		(stability, elapsedDays, expected) => {
			const reviewed = daysBeforeToday(elapsedDays)
			const retrievability = calculateRetrievability(
				stability,
				reviewed,
				TODAY,
			)
			expect(
				calculateDaysInCurrentTier(
					stability,
					reviewed,
					retrievability,
					TODAY,
				),
			).toBe(expected)
		},
	)

	it.each([5, 20, 50, 100])(
		'is non-negative across elapsed times for stability %s',
		stability => {
			for (const elapsedDays of [0, 1, 5, 10, 30, 100, 365]) {
				const reviewed = daysBeforeToday(elapsedDays)
				const retrievability = calculateRetrievability(
					stability,
					reviewed,
					TODAY,
				)
				expect(
					calculateDaysInCurrentTier(
						stability,
						reviewed,
						retrievability,
						TODAY,
					),
				).toBeGreaterThanOrEqual(0)
			}
		},
	)

	it('is consistent with the remaining duration of a tier', () => {
		const stability = 30
		const daysToFine = daysToReach(stability, FRESH_THRESHOLD)
		const daysToHazy = daysToReach(stability, FINE_THRESHOLD)
		const elapsedDays = Math.trunc((daysToFine + daysToHazy) / 2)
		const reviewed = daysBeforeToday(elapsedDays)
		const retrievability = calculateRetrievability(
			stability,
			reviewed,
			TODAY,
		)

		const daysInTier = calculateDaysInCurrentTier(
			stability,
			reviewed,
			retrievability,
			TODAY,
		)!
		const daysUntilNextTier = computeDistanceToRetrievability(
			stability,
			reviewed,
			FINE_THRESHOLD,
			TODAY,
		)
		const tierSpan = Math.trunc(daysToHazy - daysToFine)

		expect(
			Math.abs(daysInTier + daysUntilNextTier - tierSpan),
		).toBeLessThanOrEqual(1)
	})
})

describe('computeDistanceToRetrievability', () => {
	it('rounds a positive fraction up', () => {
		expect(
			computeDistanceToRetrievability(1, TODAY, FRESH_THRESHOLD, TODAY),
		).toBe(1)
	})

	it('rounds a negative fraction down', () => {
		expect(
			computeDistanceToRetrievability(
				1,
				'2026-02-15',
				FRESH_THRESHOLD,
				TODAY,
			),
		).toBe(-1)
	})

	it('treats a missing review date as today', () => {
		expect(
			computeDistanceToRetrievability(1, null, FRESH_THRESHOLD, TODAY),
		).toBe(1)
	})

	it('returns zero when the target is reached today', () => {
		expect(computeDistanceToRetrievability(1, TODAY, 1, TODAY)).toBe(0)
	})
})
