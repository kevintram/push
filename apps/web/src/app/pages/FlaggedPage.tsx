import { useNavigate } from '@tanstack/react-router'
import { Flag } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { PageLayout, usePageScrollElement } from '~/app/layouts/PageLayout'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Badge } from '~/components/ui/badge'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useReviewCards } from '~/features/review-cards/api/getReviewCards'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import type { ReviewCardType } from '~/features/review-cards/types/review-card.types'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize
} from '~/utils/estimateMasonryItemSize'

export type FlaggedPageFilter = 'all' | ReviewCardType

type FlaggedPageProps = {
	filter?: FlaggedPageFilter
	onFilterChange: (filter: FlaggedPageFilter) => void
}

export function FlaggedPage({
	filter = 'all',
	onFilterChange
}: FlaggedPageProps) {
	const navigate = useNavigate()
	const getScrollElement = usePageScrollElement()
	const selectedType = useMemo(() => {
		if (filter === 'all') return
		return filter
	}, [filter])
	const { data: reviewCards = [], isLoading } = useReviewCards({
		flagged_only: true,
		type: selectedType
	})

	const filterControls = (
		<div className='flex flex-wrap items-center gap-2'>
			<Badge
				className='cursor-pointer'
				onClick={() => onFilterChange('all')}
				variant={filter === 'all' ? 'default' : 'outline'}
			>
				All
			</Badge>
			<Badge
				className='cursor-pointer'
				onClick={() => onFilterChange('practice')}
				variant={filter === 'practice' ? 'default' : 'outline'}
			>
				Practice
			</Badge>
			<Badge
				className='cursor-pointer'
				onClick={() => onFilterChange('flashcard')}
				variant={filter === 'flashcard' ? 'default' : 'outline'}
			>
				Flashcard
			</Badge>
		</div>
	)

	let body: ReactNode
	if (isLoading) {
		body = <LoadingSpinner containerClassName='min-h-64' />
	} else if (reviewCards.length === 0) {
		body = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Flag />
					</EmptyMedia>
					<EmptyTitle>No flagged review cards</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	} else {
		body = (
			<MasonryLayout
				estimateItemSize={(card, _index, laneWidth) =>
					estimateReviewCardSize(card, laneWidth)
				}
				gap={DEFAULT_MASONRY_GAP}
				getItemKey={card => `review-card-${card.id}`}
				getScrollElement={getScrollElement ?? undefined}
				items={reviewCards}
				minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
				renderItem={card => (
					<ReviewCard
						onClick={() =>
							navigate({
								to: '/review-cards/$reviewCardId',
								params: { reviewCardId: card.id.toString() },
								search: { tab: 'home' }
							})
						}
						reviewCard={card}
					/>
				)}
			/>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header
				icon={Flag}
				title='Flagged'
				titleExtra={<CountBadge count={reviewCards.length} />}
			/>
			<PageLayout.Content className='max-w-screen space-y-4 px-3 pt-3 pb-6'>
				{filterControls}
				{body}
			</PageLayout.Content>
		</PageLayout>
	)
}
