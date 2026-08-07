import { describe, expect, it } from 'vitest'

import { calculateRetrievability } from './retrievability'

const TODAY = '2026-02-16'

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

	it('decays monotonically as more days elapse', () => {
		const at = (date: string) => calculateRetrievability(10, date, TODAY)!

		expect(at('2026-02-15')).toBeGreaterThan(at('2026-02-11'))
		expect(at('2026-02-11')).toBeGreaterThan(at('2025-12-16'))
	})

	it('clamps a future review date to zero elapsed days', () => {
		expect(calculateRetrievability(10, '2026-02-17', TODAY)).toBe(1)
	})
})
