import { useNavigate } from '@tanstack/react-router'
import { CalendarIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DuePageLayout } from '~/app/pages/due/DuePageLayout'
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
import {
	getStoredDueViewPreference,
	persistDueViewPreference
} from '~/features/review-cards/dueQueueViewPreferences'
import {
	buildFocusSearch,
	makeShuffleSeed
} from '~/features/review-cards/reviewFocusSearch'
import type {
	ReviewCardQueueItem,
	ReviewFilter
} from '~/features/review-cards/types/review-card.types'
import { groupUnifiedReviewQueue } from '~/features/review-cards/utils/groupUnifiedReviewQueue'
import { useWeekStart } from '~/stores/WeekStartContext'

export type DuePageFilter = ReviewFilter

type DuePageProps = {
	filter: DuePageFilter
	onFilterChange: (filter: DuePageFilter) => void
}

const EMPTY_ITEMS: Array<ReviewCardQueueItem> = []

export function DuePage({ filter, onFilterChange }: DuePageProps) {
	const navigate = useNavigate()
	const { weekStartDay } = useWeekStart()
	const [focusOrder, setFocusOrder] = useState(
		() => getStoredDueViewPreference().focusOrder
	)
	const [shuffleSeed, setShuffleSeed] = useState<string | undefined>()
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
		persistDueViewPreference({
			...getStoredDueViewPreference(),
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
		<DuePageLayout
			contentClassName='max-w-screen px-2.5 py-2.5 pb-4'
			filter={filter}
			focusSearch={focusSearch}
			isFocusActive={false}
			onFilterChange={onFilterChange}
			onOrderChange={handleFocusOrderChange}
			onShuffle={handleShuffle}
			order={focusOrder}
		>
			{isLoading ? (
				<LoadingSpinner containerClassName='min-h-64' />
			) : sections.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<CalendarIcon />
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
		</DuePageLayout>
	)
}
