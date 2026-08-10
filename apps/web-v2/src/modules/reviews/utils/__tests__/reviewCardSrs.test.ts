import { describe, expect, it } from 'vitest'

import type { ReviewCard } from '../../types/review.types'
import { deriveReviewCardSrsState } from '../reviewCardSrs'

function reviewCard(overrides: Partial<ReviewCard> = {}): ReviewCard {
	return {
		_creationTime: 0,
		_id: 'review-card-id' as ReviewCard['_id'],
		lastReviewedAt: undefined,
		notes: '',
		ownerId: 'user-id',
		primaryText: '',
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
			nextDueAt: null,
			retrievability: null,
			stability: null,
		})
	})

	it('derives retrievability and exposes the persisted SRS due date', () => {
		const srs = deriveReviewCardSrsState(
			reviewCard({
				dueDate: '2026-02-20',
				lastReviewedAt: '2026-02-11',
				stability: 10,
			}),
			'2026-02-16',
		)

		expect(srs.lastReviewedAt).toBe('2026-02-11')
		expect(srs.nextDueAt).toBe('2026-02-20')
		expect(srs.stability).toBe(10)
		expect(srs.retrievability).toBeCloseTo(0.9403442888929227, 14)
	})
})
