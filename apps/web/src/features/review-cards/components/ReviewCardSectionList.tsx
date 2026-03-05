import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { CountBadge } from '~/components/ui/count-badge'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import type { ReviewCardQueueItem } from '~/features/review-cards/types/review-card.types'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize
} from '~/utils/estimateMasonryItemSize'

type ReviewCardSection = {
	id: string
	items: Array<ReviewCardQueueItem>
	label: string
}

type ReviewCardSectionListProps = {
	onCardClick: (cardId: number) => void
	sections: Array<ReviewCardSection>
}

function ReviewCardMasonry({
	items,
	onCardClick
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

export function ReviewCardSectionList({
	onCardClick,
	sections
}: ReviewCardSectionListProps) {
	return (
		<div className='space-y-6'>
			{sections.map(section => (
				<section className='space-y-3' key={section.id}>
					<h3 className='flex items-center gap-2 font-bold text-xl'>
						{section.label}
						<CountBadge count={section.items.length} />
					</h3>
					<ReviewCardMasonry items={section.items} onCardClick={onCardClick} />
				</section>
			))}
		</div>
	)
}
