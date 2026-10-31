import type { Id } from '@convex/_generated/dataModel'
import { describe, expect, it } from 'vitest'

import type { Card } from '../../types/review.types'
import {
	deriveCardSrsState,
	formatStrength,
	formatStrengthDelta,
	formatStrengthTooltip,
	getStrengthDelta,
	getStrengthLevel,
} from '../cardSrs'

function card(overrides: Partial<Card> = {}): Card {
	return {
		_creationTime: 0,
		_id: 'card-id' as Card['_id'],
		lastReview: undefined,
		notes: '',
		ownerId: 'user-id',
		primaryText: '',
		searchText: '',
		secondaryText: '',
		state: 'LEARNING',
		collectionId: 'collection-id' as Card['collectionId'],
		type: 'flashcard',
		...overrides,
	}
}

describe('deriveCardSrsState', () => {
	it('represents a card without SRS state as unreviewed', () => {
		expect(deriveCardSrsState(card(), '2026-02-16')).toEqual({
			lastReviewedAt: null,
			lastRating: null,
			nextDueAt: null,
			retrievability: null,
			stability: null,
		})
	})

	it('derives retrievability and exposes the persisted SRS due date', () => {
		const srs = deriveCardSrsState(
			card({
				dueDate: '2026-02-20',
				lastReview: {
					id: 'review-id' as Id<'reviews'>,
					date: '2026-02-11',
					rating: 'good',
				},
				stability: 10,
			}),
			'2026-02-16',
		)

		expect(srs.lastReviewedAt).toBe('2026-02-11')
		expect(srs.lastRating).toBe('good')
		expect(srs.nextDueAt).toBe('2026-02-20')
		expect(srs.stability).toBe(10)
		expect(srs.retrievability).toBeCloseTo(0.9403442888929227, 14)
	})
})

describe('getStrengthLevel', () => {
	it.each([
		[0, 0],
		[6.9, 0],
		[7, 1],
		[29, 1],
		[30, 2],
		[179, 2],
		[180, 3],
		[359, 3],
		[360, 4],
		[400, 4],
	] as const)('shows %s days as %s bars', (stability, expected) => {
		expect(getStrengthLevel(stability)).toBe(expected)
	})
})

describe('formatStrength', () => {
	it.each([
		[0, '0d'],
		[0.9, '0d'],
		[1, '1d'],
		[29.9, '29d'],
		[30, '1mo'],
		[59, '1mo'],
		[119, '3mo'],
		[120, '4mo'],
		[359, '11mo'],
		[360, '12mo'],
		[365, '12mo'],
		[400, '12mo'],
	] as const)('formats %s days as %s', (stability, expected) => {
		expect(formatStrength(stability)).toBe(expected)
	})
})

describe('getStrengthDelta', () => {
	it.each([
		[null, 10, null],
		[4, 12.9, 8],
		[248, 240, -8],
		[300, 400, 65],
		[380, 400, 0],
	] as const)('changes %s → %s days by %s', (before, after, expected) => {
		expect(getStrengthDelta(before, after)).toBe(expected)
	})
})

describe('formatStrengthDelta', () => {
	it.each([
		[8, '+8d'],
		[0, '+0d'],
		[-8, '−8d'],
		[45, '+1mo'],
		[-60, '−2mo'],
		[null, 'new'],
	] as const)('formats %s days as %s', (delta, expected) => {
		expect(formatStrengthDelta(delta)).toBe(expected)
	})
})

describe('formatStrengthTooltip', () => {
	it.each([
		[1, '1 day'],
		[10, '10 days'],
		[30, '1 month'],
		[130, '4 months'],
	] as const)('spells out %s days as %s', (stability, expected) => {
		expect(formatStrengthTooltip(stability)).toBe(
			`Estimated to remember for ${expected}`,
		)
	})
})
