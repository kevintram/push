import type { ReviewCard } from '~/features/review-cards/types/review-card.types'
import type { Topic } from '~/features/topics/types/topic.types'
import { estimateCardSize } from './estimateCardSize'

export const DEFAULT_MASONRY_GAP = 16
export const DEFAULT_MASONRY_MIN_ITEM_WIDTH = 280

export function estimateTopicCardSize(topic: Topic, laneWidth: number): number {
	return estimateCardSize(
		topic.title || 'Untitled topic',
		topic.body || '',
		laneWidth
	)
}

export function estimateReviewCardSize(
	reviewCard: ReviewCard,
	laneWidth: number,
	extraHeight = 0
): number {
	return (
		estimateCardSize(
			reviewCard.prompt || 'Untitled prompt',
			reviewCard.answer || '',
			laneWidth
		) + extraHeight
	)
}
