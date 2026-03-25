import { useNavigate } from '@tanstack/react-router'
import { ListChecks } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { ReviewCardPageLayout } from '~/app/components/ReviewCardPageLayout'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useReviewCardQueuePage } from '~/features/review-cards/api/getReviewCardQueue'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import { ReviewCardSectionList } from '~/features/review-cards/components/ReviewCardSectionList'
import { useReviewCardQueueCounts } from '~/features/review-cards/hooks/useReviewCardQueueCounts'
import type { ReviewCardQueueItem } from '~/features/review-cards/types/review-card.types'
import { groupReviewCardQueueByActionDay } from '~/features/review-cards/utils/groupReviewCardQueueByActionDay'
import { groupReviewCardQueueByCreatedDay } from '~/features/review-cards/utils/groupReviewCardQueueByCreatedDay'
import { useWeekStart } from '~/stores/WeekStartContext'
import { useMediaQuery } from '~/utils/useMediaQuery'

function groupFocusedPracticeRows(
	items: Array<ReviewCardQueueItem>,
	useDesktopLayout: boolean
) {
	if (items.length <= 3) return [items]
	if (items.length === 4) {
		return [items.slice(0, 2), items.slice(2, 4)]
	}

	if (useDesktopLayout) {
		return [items.slice(0, 3), items.slice(3, 5)]
	}

	return [items.slice(0, 2), items.slice(2, 4), items.slice(4, 5)]
}

function getFocusedPracticeRowClassName(rowLength: number) {
	const baseClassName = 'mx-auto grid w-full gap-4 sm:gap-6'

	switch (rowLength) {
		case 1:
			return `${baseClassName} max-w-[34rem] grid-cols-1`
		case 2:
			return `${baseClassName} max-w-[70rem] grid-cols-1 md:grid-cols-2`
		default:
			return `${baseClassName} max-w-[70rem] grid-cols-1 md:grid-cols-2 lg:max-w-[96rem] lg:grid-cols-3`
	}
}

export type PracticeTab = 'due' | 'new'
export type PracticeScope = 'focused' | 'all'

const PRACTICE_SCOPE_OPTIONS = [
	{ label: 'Focused', value: 'focused' },
	{ label: 'All', value: 'all' }
] as const

type PracticePageProps = {
	activeTab: PracticeTab
	scope?: PracticeScope
	onActiveTabChange: (tab: PracticeTab) => void
	onScopeChange: (scope: PracticeScope) => void
}

export function PracticePage({
	activeTab,
	scope = 'all',
	onActiveTabChange,
	onScopeChange
}: PracticePageProps) {
	const navigate = useNavigate()
	const { weekStartDay } = useWeekStart()
	const isFocusedDueView = activeTab === 'due' && scope === 'focused'
	const usesDesktopFocusedLayout = useMediaQuery('(min-width: 1280px)')
	const { dueNextSevenDaysCount, dueTodayCount, newCount, overdueCount } =
		useReviewCardQueueCounts({
			type: 'practice'
		})
	const { data: queuePage, isLoading } = useReviewCardQueuePage({
		type: 'practice',
		tab: activeTab,
		focused: activeTab === 'due' ? scope === 'focused' : undefined
	})
	const items = queuePage?.items ?? []
	const tabOptions = useMemo(
		() => [
			{
				label: 'Due',
				value: 'due' as const,
				count: (
					<>
						{overdueCount > 0 ? (
							<CountBadge count={overdueCount} size='compact' tone='danger' />
						) : null}
						{dueTodayCount > 0 ? (
							<CountBadge count={dueTodayCount} size='compact' tone='info' />
						) : null}
					</>
				)
			},
			{
				label: 'New',
				value: 'new' as const,
				count: <CountBadge count={newCount} size='compact' tone='neutral' />
			}
		],
		[dueTodayCount, newCount, overdueCount]
	)
	const dueSummary = useMemo(() => {
		if (activeTab !== 'due') return null

		return (
			<div className='flex items-center gap-2 text-muted-foreground text-sm'>
				<span>Due in next 7d</span>
				<CountBadge count={dueNextSevenDaysCount} variant='outline' />
			</div>
		)
	}, [activeTab, dueNextSevenDaysCount])

	const dueSections = useMemo(
		() =>
			groupReviewCardQueueByActionDay(items, weekStartDay, queuePage?.as_of),
		[items, queuePage?.as_of, weekStartDay]
	)
	const focusedRows = useMemo(
		() => groupFocusedPracticeRows(items, usesDesktopFocusedLayout),
		[items, usesDesktopFocusedLayout]
	)
	const newSections = useMemo(
		() =>
			groupReviewCardQueueByCreatedDay(items, weekStartDay, queuePage?.as_of),
		[items, queuePage?.as_of, weekStartDay]
	)

	let content: ReactNode
	if (isLoading) {
		content = <LoadingSpinner containerClassName='min-h-64' />
	} else if (items.length === 0) {
		content = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<ListChecks />
					</EmptyMedia>
					<EmptyTitle>No practice cards in this view</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	} else if (isFocusedDueView) {
		content = (
			<div
				className='mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6'
				data-testid='focused-practice-layout'
			>
				{focusedRows.map((row, rowIndex) => (
					<div
						className={getFocusedPracticeRowClassName(row.length)}
						data-row-size={row.length}
						data-testid='focused-practice-row'
						key={`focused-practice-row-${rowIndex}`}
					>
						{row.map(item => (
							<div
								className='w-full max-w-[34rem] justify-self-center'
								key={`${item.card.id}-${item.review_id ?? 'new'}`}
							>
								<ReviewCard
									enableLargeCardMode={true}
									minHeight={380}
									onClick={() =>
										navigate({
											to: '/review-cards/$reviewCardId',
											params: { reviewCardId: item.card.id.toString() },
											search: { tab: 'home' }
										})
									}
									reviewCard={item.card}
								/>
							</div>
						))}
					</div>
				))}
			</div>
		)
	} else {
		const sections = activeTab === 'due' ? dueSections : newSections
		content = (
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
		)
	}

	return (
		<ReviewCardPageLayout
			activeTab={activeTab}
			icon={ListChecks}
			isDueView={activeTab === 'due'}
			isFocusedDueView={isFocusedDueView}
			onActiveTabChange={onActiveTabChange}
			onScopeChange={onScopeChange}
			scope={scope}
			scopeBarActions={dueSummary}
			scopeOptions={PRACTICE_SCOPE_OPTIONS}
			tabOptions={tabOptions}
			title='Practice'
		>
			{content}
		</ReviewCardPageLayout>
	)
}
