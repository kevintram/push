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
			freshnessTier: null,
			lastReviewedAt: null,
			nextDueAt: null,
			stability: null,
		})
	})

	it('derives the current tier while leaving aggregate due data unset', () => {
		expect(
			deriveReviewCardSrsState(
				reviewCard({
					lastReviewedAt: '2026-02-11',
					stability: 10,
				}),
				'2026-02-16',
			),
		).toEqual({
			freshnessTier: 'Fine',
			lastReviewedAt: '2026-02-11',
			nextDueAt: null,
			stability: 10,
		})
	})
})
