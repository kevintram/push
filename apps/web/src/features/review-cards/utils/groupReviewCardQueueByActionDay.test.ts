import type {
	ReviewCard,
	ReviewCardQueueItem
} from '../types/review-card.types'
import { groupReviewCardQueueByActionDay } from './groupReviewCardQueueByActionDay'

const baseCard: ReviewCard = {
	id: 1,
	topic_id: 1,
	topic_title: 'Algebra',
	type: 'practice',
	prompt: 'Prompt',
	answer: 'Answer',
	inserted_at: '2026-01-01T12:00:00.000Z',
	updated_at: '2026-01-02T12:00:00.000Z',
	last_review_rating: null,
	stability: null,
	difficulty: null,
	state: 'new',
	step: null,
	retired: false,
	pinned_at: null,
	last_reviewed_at: null,
	retrievability: null,
	freshness_tier: null,
	days_until_next_tier: null,
	days_in_current_tier: null,
	is_new: true,
	status_badges: []
}

function buildQueueItem(
	overrides: Partial<ReviewCardQueueItem>
): ReviewCardQueueItem {
	return {
		queue_type: 'due',
		card: baseCard,
		review_id: null,
		scheduled_at: null,
		days_until_due: null,
		days_until_hazy: null,
		...overrides
	}
}

describe('groupReviewCardQueueByActionDay', () => {
	it('sorts overdue due items by recency before hazy overdue items', () => {
		const sections = groupReviewCardQueueByActionDay(
			[
				buildQueueItem({
					queue_type: 'due',
					card: { ...baseCard, id: 11, prompt: 'Stale overdue due' },
					review_id: 11,
					scheduled_at: '2026-01-11',
					days_until_due: -4
				}),
				buildQueueItem({
					queue_type: 'hazy',
					card: { ...baseCard, id: 12, prompt: 'Hazy overdue' },
					days_until_hazy: 0
				}),
				buildQueueItem({
					queue_type: 'due',
					card: { ...baseCard, id: 13, prompt: 'Slightly overdue due' },
					review_id: 13,
					scheduled_at: '2026-01-14',
					days_until_due: -1
				}),
				buildQueueItem({
					queue_type: 'due',
					card: { ...baseCard, id: 14, prompt: 'Today due' },
					review_id: 14,
					scheduled_at: '2026-01-15',
					days_until_due: 0
				})
			],
			0,
			'2026-01-15'
		)

		expect(sections.map(section => section.label)).toEqual(['Overdue', 'Today'])
		expect(sections[0]?.items.map(item => item.card.prompt)).toEqual([
			'Slightly overdue due',
			'Stale overdue due',
			'Hazy overdue'
		])
		expect(sections[1]?.items.map(item => item.card.prompt)).toEqual([
			'Today due'
		])
	})
})
