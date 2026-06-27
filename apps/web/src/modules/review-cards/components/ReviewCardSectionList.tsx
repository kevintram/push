import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { CountBadge } from '~/components/ui/count-badge'
import { ReviewCard } from '~/modules/review-cards/components/ReviewCard'
import { type ReviewCardQueueItem } from '~/modules/review-cards/types/review-card.types'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize,
} from '~/utils/estimateMasonryItemSize'

type ReviewCardSection = {
	id: string
	items: Array<ReviewCardQueueItem>
	label: string
	subLabel?: string
	headingClassName?: string
}

type ReviewCardSectionListProps = {
	onCardClick: (cardId: number) => void
	sections: Array<ReviewCardSection>
}

function ReviewCardMasonry({
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

export function ReviewCardSectionList({
	onCardClick,
	sections,
}: ReviewCardSectionListProps) {
	return (
		<div className='space-y-6'>
			{sections.map(section => (
				<section className='space-y-3' key={section.id}>
					<div>
						<h3
							className={`flex items-center gap-2 font-bold text-xl ${section.headingClassName ?? ''}`}
						>
							{section.label}
							<CountBadge count={section.items.length} />
						</h3>
						{section.subLabel ? (
							<p className='text-muted-foreground text-sm'>
								{section.subLabel}
							</p>
						) : null}
					</div>
					<ReviewCardMasonry
						items={section.items}
						onCardClick={onCardClick}
					/>
				</section>
			))}
		</div>
	)
}
