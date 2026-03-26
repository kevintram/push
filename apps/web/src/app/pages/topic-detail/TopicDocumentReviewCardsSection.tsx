import { Plus } from 'lucide-react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import type {
	ReviewCard as ReviewCardModel,
	ReviewCardType
} from '~/features/review-cards/types/review-card.types'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize
} from '~/utils/estimateMasonryItemSize'
import type { TopicDetailReviewCardFilter } from './shared'
import { TopicDocumentReviewCardFilter } from './TopicDocumentReviewCardFilter'

interface TopicDocumentReviewCardsSectionProps {
	filteredReviewCards: Array<ReviewCardModel>
	getScrollElement: () => HTMLDivElement | null
	hasReviewCards: boolean
	hidesSecondary: boolean
	isCreatingReviewCard: boolean
	onAddReviewCard: (type: ReviewCardType) => void
	onFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onOpenReviewCard: (reviewCardId: number) => void
	resolvedSectionFilter: TopicDetailReviewCardFilter
	sectionLabel: string
}

export function TopicDocumentReviewCardsSection({
	filteredReviewCards,
	getScrollElement,
	hasReviewCards,
	hidesSecondary,
	isCreatingReviewCard,
	onAddReviewCard,
	onFilterChange,
	onOpenReviewCard,
	resolvedSectionFilter,
	sectionLabel
}: TopicDocumentReviewCardsSectionProps) {
	return (
		<div className='space-y-3'>
			<div className='flex flex-wrap items-center justify-between gap-2.5'>
				<TopicDocumentReviewCardFilter
					activeFilter={resolvedSectionFilter}
					onFilterChange={onFilterChange}
				/>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								className='shrink-0 rounded-full'
								disabled={isCreatingReviewCard}
								size='sm'
								variant='outline'
							>
								<Plus className='h-4 w-4' />
								Add
							</Button>
						}
					/>
					<DropdownMenuContent align='end'>
						<DropdownMenuItem onClick={() => onAddReviewCard('practice')}>
							Practice
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onAddReviewCard('flashcard')}>
							Flashcard
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{hasReviewCards ? (
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
