import {
	type ReviewCard,
	type ReviewCardQueueItem,
} from '../../types/review-card.types'
import { groupReviewCardQueueByActionDay } from '../groupReviewCardQueueByActionDay'

const baseCard: ReviewCard = {
	id: 1,
	topicId: 1,
	topicTitle: 'Algebra',
	type: 'practice',
	primaryText: 'Prompt',
	secondaryText: 'Answer',
	insertedAt: '2026-01-01T12:00:00.000Z',
	updatedAt: '2026-01-02T12:00:00.000Z',
	lastReviewRating: null,
	stability: null,
	difficulty: null,
	state: 'new',
	step: null,
	retired: false,
	flaggedAt: null,
	lastReviewedAt: null,
	retrievability: null,
	freshnessTier: null,
	daysUntilNextTier: null,
	daysInCurrentTier: null,
	isNew: true,
	statusBadges: [],
	notes: '',
}

function buildQueueItem(
	overrides: Partial<ReviewCardQueueItem>,
): ReviewCardQueueItem {
	return {
		queueType: 'due',
		card: baseCard,
		reviewId: null,
		scheduledAt: null,
		actionDays: null,
		daysUntilDue: null,
		daysUntilHazy: null,
		...overrides,
	}
}

describe('groupReviewCardQueueByActionDay', () => {
	it('sorts overdue due items by recency before hazy overdue items', () => {
		const sections = groupReviewCardQueueByActionDay(
			[
				buildQueueItem({
					queueType: 'due',
					card: {
						...baseCard,
						id: 11,
						primaryText: 'Stale overdue due',
					},
					reviewId: 11,
					scheduledAt: '2026-01-11',
					actionDays: -4,
					daysUntilDue: -4,
				}),
				buildQueueItem({
					queueType: 'hazy',
					card: { ...baseCard, id: 12, primaryText: 'Hazy overdue' },
					actionDays: -1,
					daysUntilHazy: -2,
				}),
				buildQueueItem({
					queueType: 'due',
					card: {
						...baseCard,
						id: 13,
						primaryText: 'Slightly overdue due',
					},
					reviewId: 13,
					scheduledAt: '2026-01-14',
					actionDays: -1,
					daysUntilDue: -1,
				}),
				buildQueueItem({
					queueType: 'due',
					card: { ...baseCard, id: 14, primaryText: 'Today due' },
					reviewId: 14,
					scheduledAt: '2026-01-15',
					actionDays: 0,
					daysUntilDue: 0,
				}),
			],
			0,
			'2026-01-15',
		)

		expect(sections.map(section => section.label)).toEqual([
			'Overdue',
			'Today',
		])
		expect(sections[0]?.items.map(item => item.card.primaryText)).toEqual([
			'Slightly overdue due',
			'Stale overdue due',
			'Hazy overdue',
		])
		expect(sections[1]?.items.map(item => item.card.primaryText)).toEqual([
			'Today due',
		])
	})
})
