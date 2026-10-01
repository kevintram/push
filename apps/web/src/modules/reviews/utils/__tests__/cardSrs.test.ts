import type { Id } from '@convex/_generated/dataModel'
import { describe, expect, it } from 'vitest'

import type { Card } from '../../types/review.types'
import {
	deriveCardSrsState,
	formatDurability,
	formatDurabilityTooltip,
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

describe('formatDurability', () => {
	it.each([
		[null, null],
		[1, '1d'],
		[10.4, '10d'],
		[10.5, '11d'],
	] as const)('formats %s as %s', (stability, expected) => {
		expect(formatDurability(stability)).toBe(expected)
	})
})

describe('formatDurabilityTooltip', () => {
	it.each([
		[null, null],
		[10.4, 'Estimated you will remember this for at least 10d'],
	] as const)('formats %s as %s', (stability, expected) => {
		expect(formatDurabilityTooltip(stability)).toBe(expected)
	})
})
