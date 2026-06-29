import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { ReviewCard } from '~/modules/review-cards/components/ReviewCard'
import { type ReviewCardQueueItem } from '~/modules/review-cards/types/review-card.types'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize,
} from '~/utils/estimateMasonryItemSize'

export function ReviewCardMasonry({
	items,
	onCardClick,
}: {
	items: Array<ReviewCardQueueItem>
	onCardClick: (cardId: number) => void
}) {
	return (
		<MasonryLayout
			estimateItemSize={(item, _index, laneWidth) =>
				estimateReviewCardSize(item.card, laneWidth)
			}
			gap={DEFAULT_MASONRY_GAP}
			getItemKey={item => `${item.card.id}-${item.review_id ?? 'new'}`}
			items={items}
			minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
			renderItem={item => (
				<ReviewCard
					onClick={() => onCardClick(item.card.id)}
					reviewCard={item.card}
				/>
			)}
		/>
	)
}
