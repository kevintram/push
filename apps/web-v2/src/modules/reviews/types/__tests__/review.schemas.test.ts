import * as v from 'valibot'
import { describe, expect, it } from 'vitest'

import { ReviewSchema } from '../review.schemas'

describe('ReviewSchema', () => {
	it('normalizes primary, foreign, and nested review-card IDs', () => {
		const review = v.parse(ReviewSchema, {
			id: 31,
			review_card_id: 12,
			rating: null,
			description: '',
			notes: '',
			scheduled_at: null,
			completed_at: null,
			effective_date: null,
			inserted_at: '2026-07-21T00:00:00Z',
			updated_at: '2026-07-21T00:00:00Z',
			review_card: {
				id: 12,
				topic_id: 4,
				type: 'practice',
				primary_text: 'Question',
				secondary_text: 'Answer',
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
		})

		expect(review).toMatchObject({
			id: '31',
			review_card_id: '12',
			review_card: { id: '12', topic_id: '4' },
		})
	})
})
