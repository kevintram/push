import { BookOpen, Plus } from 'lucide-react'

import { DetailTabsShell, type DetailTabDefinition } from './DetailTabsShell'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Badge } from '~/components/ui/badge'
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
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import type { ReviewCard as ReviewCardModel } from '~/features/review-cards/types/review-card.types'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize
} from '~/utils/estimateMasonryItemSize'
import type { TopicDetailReviewCardFilter } from './shared'

export function TopicDetailReviewCardsTab({
	getScrollElement,
	isCreatingReviewCard,
	isLoading,
	onAddReviewCard,
	onCardTypeFilterChange,
	onOpenReviewCard,
	resolvedCardTypeFilter,
	reviewCards,
	topicTitle
}: {
	getScrollElement: () => HTMLDivElement | null
	isCreatingReviewCard: boolean
	isLoading: boolean
	onAddReviewCard: (type: 'practice' | 'flashcard') => void
	onCardTypeFilterChange: (filter: TopicDetailReviewCardFilter) => void
	onOpenReviewCard: (reviewCardId: number) => void
	resolvedCardTypeFilter: TopicDetailReviewCardFilter
	reviewCards: Array<ReviewCardModel>
	topicTitle: string
}) {
	let reviewCardsContent: React.ReactNode
	if (isLoading) {
		reviewCardsContent = <LoadingSpinner containerClassName='min-h-40' />
	} else if (reviewCards.length === 0) {
		reviewCardsContent = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<BookOpen />
					</EmptyMedia>
					<EmptyTitle>No review cards in this filter</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	} else {
		reviewCardsContent = (
			<MasonryLayout
				estimateItemSize={(card, _index, laneWidth) =>
					estimateReviewCardSize(card, laneWidth)
				}
				gap={DEFAULT_MASONRY_GAP}
				getItemKey={card => `review-card-${card.id}`}
				getScrollElement={getScrollElement}
				items={reviewCards}
				minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
				renderItem={card => (
					<ReviewCard
						onClick={() => onOpenReviewCard(card.id)}
						parentLabel={topicTitle || 'Current topic'}
						reviewCard={card}
					/>
				)}
			/>
		)
	}

	const reviewCardAddButton = (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						className='rounded-full'
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
	)

	const tabs: Array<DetailTabDefinition> = [
		{
			value: 'review_cards',
			label: 'Review Cards',
			count: reviewCards.length,
			content: (
				<div className='space-y-4'>
					<div className='flex items-center gap-2'>
						<Badge
							className='cursor-pointer'
							onClick={() => onCardTypeFilterChange('all')}
							variant={resolvedCardTypeFilter === 'all' ? 'default' : 'outline'}
						>
							All
						</Badge>
						<Badge
							className='cursor-pointer'
							onClick={() => onCardTypeFilterChange('practice')}
							variant={
								resolvedCardTypeFilter === 'practice' ? 'default' : 'outline'
							}
						>
							Practice
						</Badge>
						<Badge
							className='cursor-pointer'
							onClick={() => onCardTypeFilterChange('flashcard')}
							variant={
								resolvedCardTypeFilter === 'flashcard' ? 'default' : 'outline'
							}
						>
							Flashcard
						</Badge>
					</div>
					{reviewCardsContent}
				</div>
			)
		}
	]

	return (
		<DetailTabsShell
			defaultValue='review_cards'
			headerEndContent={reviewCardAddButton}
			tabs={tabs}
		/>
	)
}
