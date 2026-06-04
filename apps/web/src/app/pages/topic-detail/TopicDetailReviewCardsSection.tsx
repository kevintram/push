import { Plus } from 'lucide-react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ReviewCard } from '~/modules/review-cards/components/ReviewCard'
import type {
	ReviewCard as ReviewCardModel,
	ReviewCardType
} from '~/modules/review-cards/types/review-card.types'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize
} from '~/utils/estimateMasonryItemSize'
import type {
	TopicDetailReviewCardControlsVariant,
	TopicDetailReviewCardFilter
} from './shared'
import {
	TopicDetailReviewCardAddButton,
	TopicDetailReviewCardFilterControls
} from './TopicDetailReviewCardControls'

interface TopicDetailReviewCardsSectionProps {
	filteredReviewCards: Array<ReviewCardModel>
	getScrollElement: () => HTMLDivElement | null
	hasReviewCards: boolean
	hidesSecondary: boolean
	isCreatingReviewCard: boolean
	isReviewCardsLoading: boolean
	onAddReviewCard: (type: ReviewCardType) => void
	onFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onOpenReviewCard: (reviewCardId: number) => void
	reviewCardControlsVariant: TopicDetailReviewCardControlsVariant
	resolvedSectionFilter: TopicDetailReviewCardFilter
	sectionLabel: string
}

export function TopicDetailReviewCardsSection({
	filteredReviewCards,
	getScrollElement,
	hasReviewCards,
	hidesSecondary,
	isCreatingReviewCard,
	isReviewCardsLoading,
	onAddReviewCard,
	onFilterChange,
	onOpenReviewCard,
	reviewCardControlsVariant,
	resolvedSectionFilter,
	sectionLabel
}: TopicDetailReviewCardsSectionProps) {
	return (
		<div className='space-y-3 pt-3'>
			<div>
				<div className='flex flex-wrap items-center justify-between gap-2.5'>
					<p className='font-bold text-[0.6875rem] text-muted-foreground/70 uppercase tracking-widest'>
						Review cards
					</p>
					<TopicDetailReviewCardAddButton
						controlsVariant={reviewCardControlsVariant}
						isCreatingReviewCard={isCreatingReviewCard}
						onAddReviewCard={onAddReviewCard}
					/>
				</div>
				<div aria-hidden={true} className='mt-1 h-px w-full bg-border' />
				<div className='pt-2'>
					<TopicDetailReviewCardFilterControls
						activeFilter={resolvedSectionFilter}
						controlsVariant={reviewCardControlsVariant}
						onFilterChange={onFilterChange}
					/>
				</div>
			</div>
			{isReviewCardsLoading ? (
				<LoadingSpinner
					containerClassName='min-h-12 py-3'
					label='Loading review cards'
					size='sm'
				/>
			) : hasReviewCards ? (
				filteredReviewCards.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<Plus />
							</EmptyMedia>
							<EmptyTitle>No review cards in this filter</EmptyTitle>
						</EmptyHeader>
					</Empty>
				) : (
					<MasonryLayout
						estimateItemSize={(card, _index, laneWidth) =>
							estimateReviewCardSize(card, laneWidth)
						}
						gap={DEFAULT_MASONRY_GAP}
						getItemKey={card => `review-card-${card.id}`}
						getScrollElement={getScrollElement}
						items={filteredReviewCards}
						measurementVersion={hidesSecondary ? 'hidden' : 'shown'}
						minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
						renderItem={card => (
							<ReviewCard
								onClick={() => onOpenReviewCard(card.id)}
								parentLabel={sectionLabel}
								reviewCard={card}
							/>
						)}
					/>
				)
			) : null}
		</div>
	)
}
