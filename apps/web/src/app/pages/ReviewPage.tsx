import { Link, useNavigate } from '@tanstack/react-router'
import { BookOpenCheck, Play } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	ReviewHeaderControls,
	ReviewStatusBadges
} from '~/app/pages/review/ReviewHeaderControls'
import { Button } from '~/components/ui/button'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useReviewCardQueuePage } from '~/features/review-cards/api/getReviewCardQueue'
import { ReviewCardSectionList } from '~/features/review-cards/components/ReviewCardSectionList'
import { useReviewCardQueueCounts } from '~/features/review-cards/hooks/useReviewCardQueueCounts'
import {
	buildFocusSearch,
	makeShuffleSeed
} from '~/features/review-cards/reviewFocusSearch'
import {
	getStoredReviewViewPreference,
	persistReviewViewPreference
} from '~/features/review-cards/reviewQueueViewPreferences'
import type {
	ReviewCardQueueItem,
	ReviewFilter
} from '~/features/review-cards/types/review-card.types'
import { groupUnifiedReviewQueue } from '~/features/review-cards/utils/groupUnifiedReviewQueue'
import { useWeekStart } from '~/stores/WeekStartContext'

export type ReviewPageFilter = ReviewFilter

type ReviewPageProps = {
	filter: ReviewPageFilter
	onFilterChange: (filter: ReviewPageFilter) => void
}

const EMPTY_ITEMS: Array<ReviewCardQueueItem> = []

export function ReviewPage({ filter, onFilterChange }: ReviewPageProps) {
	const navigate = useNavigate()
	const { weekStartDay } = useWeekStart()
	const [focusOrder, setFocusOrder] = useState(
		() => getStoredReviewViewPreference().focusOrder
	)
	const [shuffleSeed, setShuffleSeed] = useState<string | undefined>()
	const { dueTodayCount, overdueCount } = useReviewCardQueueCounts({ filter })
	const newQueueQuery = useReviewCardQueuePage({
		filter,
		tab: 'new'
	})
	const dueQueueQuery = useReviewCardQueuePage({
		filter,
		tab: 'due',
		focused: false
	})
	const newItems = newQueueQuery.data?.items ?? EMPTY_ITEMS
	const dueItems = dueQueueQuery.data?.items ?? EMPTY_ITEMS
	const isLoading = newQueueQuery.isLoading || dueQueueQuery.isLoading
	const sections = useMemo(
		() =>
			groupUnifiedReviewQueue(
				{ dueItems, newItems },
				{
					asOf: dueQueueQuery.data?.as_of ?? newQueueQuery.data?.as_of,
					weekStartDay
				}
			),
		[
			dueItems,
			dueQueueQuery.data?.as_of,
			newItems,
			newQueueQuery.data?.as_of,
			weekStartDay
		]
	)
	const focusSearch = useMemo(
		() => buildFocusSearch({ filter, order: focusOrder, shuffle: shuffleSeed }),
		[filter, focusOrder, shuffleSeed]
	)

	useEffect(() => {
		persistReviewViewPreference({
			...getStoredReviewViewPreference(),
			focusOrder
		})
	}, [focusOrder])

	function handleFocusOrderChange(nextOrder: typeof focusOrder) {
		setFocusOrder(nextOrder)
		if (nextOrder !== 'random') setShuffleSeed(undefined)
	}

	function handleShuffle() {
		setFocusOrder('random')
		setShuffleSeed(makeShuffleSeed())
	}

	return (
		<PageLayout>
			<PageLayout.Header
				actions={
					<Button
						nativeButton={false}
						render={<Link search={focusSearch} to='/review/focus' />}
						size='sm'
					>
						<Play className='size-4' />
						Focus
					</Button>
				}
				icon={BookOpenCheck}
				title='Reviews'
				titleExtra={
					<ReviewStatusBadges
						dueTodayCount={dueTodayCount}
						overdueCount={overdueCount}
					/>
				}
			>
				<ReviewHeaderControls
					filter={filter}
					onFilterChange={onFilterChange}
					onOrderChange={handleFocusOrderChange}
					onShuffle={handleShuffle}
					order={focusOrder}
				/>
			</PageLayout.Header>
			<PageLayout.Content className='max-w-screen px-2.5 py-2.5 pb-4'>
				{isLoading ? (
					<LoadingSpinner containerClassName='min-h-64' />
				) : sections.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon'>
								<BookOpenCheck />
							</EmptyMedia>
							<EmptyTitle>You're all caught up!</EmptyTitle>
							<EmptyDescription>
								There are no review cards in this queue.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<ReviewCardSectionList
						onCardClick={cardId =>
							navigate({
								to: '/review-cards/$reviewCardId',
								params: { reviewCardId: cardId.toString() },
								search: { tab: 'home' }
							})
						}
						sections={sections}
					/>
				)}
			</PageLayout.Content>
		</PageLayout>
	)
}
