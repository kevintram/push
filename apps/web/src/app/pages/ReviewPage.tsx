import { Link, useNavigate } from '@tanstack/react-router'
import { BookOpenCheck, Play } from 'lucide-react'
import { useMemo } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { Button } from '~/components/ui/button'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useReviewCardQueuePage } from '~/features/review-cards/api/getReviewCardQueue'
import { ReviewCardSectionList } from '~/features/review-cards/components/ReviewCardSectionList'
import { useReviewCardQueueCounts } from '~/features/review-cards/hooks/useReviewCardQueueCounts'
import type { ReviewFilter } from '~/features/review-cards/types/review-card.types'
import { groupUnifiedReviewQueue } from '~/features/review-cards/utils/groupUnifiedReviewQueue'
import { useWeekStart } from '~/stores/WeekStartContext'

export type ReviewPageFilter = ReviewFilter

const REVIEW_FILTER_OPTIONS = [
	{ label: 'All', value: 'all' },
	{ label: 'Practice', value: 'practice' },
	{ label: 'Flashcards', value: 'flashcards' }
] as const

type ReviewPageProps = {
	filter: ReviewPageFilter
	onFilterChange: (filter: ReviewPageFilter) => void
}

export function ReviewPage({ filter, onFilterChange }: ReviewPageProps) {
	const navigate = useNavigate()
	const { weekStartDay } = useWeekStart()
	const { dueNextSevenDaysCount, dueTodayCount, newCount, overdueCount } =
		useReviewCardQueueCounts({ filter })
	const newQueueQuery = useReviewCardQueuePage({
		filter,
		tab: 'new'
	})
	const dueQueueQuery = useReviewCardQueuePage({
		filter,
		tab: 'due',
		focused: false
	})
	const newItems = newQueueQuery.data?.items ?? []
	const dueItems = dueQueueQuery.data?.items ?? []
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
	return (
		<PageLayout>
			<PageLayout.Header
				actions={
					<Button
						nativeButton={false}
						render={<Link search={{ filter }} to='/review/focus' />}
						size='sm'
					>
						<Play className='size-4' />
						Focus
					</Button>
				}
				icon={BookOpenCheck}
				title='Reviews'
			>
				<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex flex-wrap items-center gap-2 text-muted-foreground text-sm'>
						<span className='flex items-center gap-1.5'>
							Overdue
							<CountBadge count={overdueCount} size='compact' tone='danger' />
						</span>
						<span className='flex items-center gap-1.5'>
							Due today
							<CountBadge count={dueTodayCount} size='compact' tone='info' />
						</span>
						<span className='flex items-center gap-1.5'>
							New
							<CountBadge count={newCount} size='compact' tone='neutral' />
						</span>
						<span className='flex items-center gap-1.5'>
							Next 7d
							<CountBadge
								count={dueNextSevenDaysCount}
								size='compact'
								variant='outline'
							/>
						</span>
					</div>
					<Tabs
						onValueChange={value => onFilterChange(value as ReviewFilter)}
						value={filter}
					>
						<TabsList variant='badge'>
							{REVIEW_FILTER_OPTIONS.map(option => (
								<TabsTrigger
									badgeStyle={true}
									key={option.value}
									value={option.value}
								>
									{option.label}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				</div>
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
