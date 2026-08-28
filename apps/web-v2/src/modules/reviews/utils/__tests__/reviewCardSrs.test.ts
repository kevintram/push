import type { Id } from '@convex/_generated/dataModel'
import { describe, expect, it } from 'vitest'

import type { ReviewCard } from '../../types/review.types'
import { deriveReviewCardSrsState, getFreshnessTier } from '../reviewCardSrs'

function reviewCard(overrides: Partial<ReviewCard> = {}): ReviewCard {
	return {
		_creationTime: 0,
		_id: 'review-card-id' as ReviewCard['_id'],
		lastReview: undefined,
		notes: '',
		ownerId: 'user-id',
		primaryText: '',
		searchText: '',
		secondaryText: '',
		state: 'LEARNING',
		topicId: 'topic-id' as ReviewCard['topicId'],
		type: 'flashcard',
		...overrides,
	}
}

describe('deriveReviewCardSrsState', () => {
	it('represents a card without SRS state as unreviewed', () => {
		expect(deriveReviewCardSrsState(reviewCard(), '2026-02-16')).toEqual({
			lastReviewedAt: null,
			lastRating: null,
			nextDueAt: null,
			retrievability: null,
			stability: null,
		})
	})

	it('derives retrievability and exposes the persisted SRS due date', () => {
		const srs = deriveReviewCardSrsState(
			reviewCard({
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

describe('getFreshnessTier', () => {
	it.each([
		[null, null],
		[0.75, 'Forgotten'],
		[0.8, 'Hazy'],
		[0.85, 'Hazy'],
		[0.9, 'Fine'],
		[0.95, 'Fine'],
		[0.96, 'Fresh'],
	] as const)('maps %s retrievability to %s', (retrievability, tier) => {
		expect(getFreshnessTier(retrievability)).toBe(tier)
	})
})
