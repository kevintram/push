import { describe, expect, it } from 'vitest'

import type { Review } from '../../types/review.types'
import { getLatestCompletedReview, groupReviews } from '../reviewCollections'

function makeReview(id: number, values: Partial<Review> = {}): Review {
	return {
		id,
		review_card_id: 1,
		rating: null,
		description: '',
		notes: '',
		scheduled_at: null,
		completed_at: null,
		effective_date: null,
		inserted_at: `2026-07-${String(id).padStart(2, '0')}T00:00:00Z`,
		updated_at: '2026-07-01T00:00:00Z',
		review_card: {
			id: 1,
			topic_id: 1,
			type: 'practice',
			primary_text: 'Card',
			secondary_text: '',
		},
		stability_before: null,
		difficulty_before: null,
		state_before: null,
		step_before: null,
		due_before: null,
		stability_after: null,
		difficulty_after: null,
		state_after: null,
		step_after: null,
		due_after: null,
		...values,
	}
}

describe('groupReviews', () => {
	it('groups and orders review-card history like Web V1', () => {
		const completedOlder = makeReview(1, {
			completed_at: '2026-07-01',
			effective_date: '2026-07-01',
		})
		const completedLatest = makeReview(2, {
			completed_at: '2026-07-09',
			effective_date: '2026-07-09',
		})
		const overdue = makeReview(3, {
			scheduled_at: '2026-07-10',
			effective_date: '2026-07-10',
		})
		const today = makeReview(4, {
			scheduled_at: '2026-07-11',
			effective_date: '2026-07-11',
		})
		const upcoming = makeReview(5, {
			scheduled_at: '2026-07-12',
			effective_date: '2026-07-12',
		})
		const uncompleted = makeReview(6)

		const groups = groupReviews(
			[
				completedOlder,
				overdue,
				upcoming,
				completedLatest,
				today,
				uncompleted,
			],
			'2026-07-11',
		)

		expect(groups.uncompleted).toEqual([uncompleted])
		expect(groups.overdue).toEqual([overdue])
		expect(groups.today).toEqual([today])
		expect(groups.upcoming).toEqual([upcoming])
		expect(groups.completed).toEqual([completedLatest, completedOlder])
		expect(
			getLatestCompletedReview([
				completedOlder,
				upcoming,
				completedLatest,
			]),
		).toBe(completedLatest)
	})
})
