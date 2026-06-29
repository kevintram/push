import {
	type ReviewCard,
	type ReviewCardQueueItem,
} from '../../types/review-card.types'
import { groupReviewCardQueueByActionDay } from '../groupReviewCardQueueByActionDay'

const baseCard: ReviewCard = {
	id: 1,
	topic_id: 1,
	topic_title: 'Algebra',
	type: 'practice',
	primary_text: 'Prompt',
	secondary_text: 'Answer',
	inserted_at: '2026-01-01T12:00:00.000Z',
	updated_at: '2026-01-02T12:00:00.000Z',
	last_review_rating: null,
	stability: null,
	difficulty: null,
	state: 'new',
	step: null,
	retired: false,
	flagged_at: null,
	last_reviewed_at: null,
	retrievability: null,
	freshness_tier: null,
	days_until_next_tier: null,
	days_in_current_tier: null,
	is_new: true,
	status_badges: [],
	notes: '',
}

function buildQueueItem(
	overrides: Partial<ReviewCardQueueItem>,
): ReviewCardQueueItem {
	return {
		queue_type: 'due',
		card: baseCard,
		review_id: null,
		scheduled_at: null,
		action_days: null,
		days_until_due: null,
		days_until_hazy: null,
		...overrides,
	}
}

describe('groupReviewCardQueueByActionDay', () => {
	it('sorts overdue due items by recency before hazy overdue items', () => {
		const sections = groupReviewCardQueueByActionDay(
			[
				buildQueueItem({
					queue_type: 'due',
					card: {
						...baseCard,
						id: 11,
						primary_text: 'Stale overdue due',
					},
					review_id: 11,
					scheduled_at: '2026-01-11',
					action_days: -4,
					days_until_due: -4,
				}),
				buildQueueItem({
					queue_type: 'hazy',
					card: { ...baseCard, id: 12, primary_text: 'Hazy overdue' },
					action_days: -1,
					days_until_hazy: -2,
				}),
				buildQueueItem({
					queue_type: 'due',
					card: {
						...baseCard,
						id: 13,
						primary_text: 'Slightly overdue due',
					},
					review_id: 13,
					scheduled_at: '2026-01-14',
					action_days: -1,
					days_until_due: -1,
				}),
				buildQueueItem({
					queue_type: 'due',
					card: { ...baseCard, id: 14, primary_text: 'Today due' },
					review_id: 14,
					scheduled_at: '2026-01-15',
					action_days: 0,
					days_until_due: 0,
				}),
			],
			0,
			'2026-01-15',
		)

		expect(sections.map(section => section.label)).toEqual([
			'Overdue',
			'Today',
		])
		expect(sections[0]?.items.map(item => item.card.primary_text)).toEqual([
			'Slightly overdue due',
			'Stale overdue due',
			'Hazy overdue',
		])
		expect(sections[1]?.items.map(item => item.card.primary_text)).toEqual([
			'Today due',
		])
	})
})
