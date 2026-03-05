import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { ListChecks } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { CountBadge } from '~/components/ui/count-badge'
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useReviewCardQueue } from '~/features/review-cards/api/getReviewCardQueue'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import type { ReviewCardQueueItem } from '~/features/review-cards/types/review-card.types'
import { cn } from '~/lib/utils'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize
} from '~/utils/estimateMasonryItemSize'
import { groupByDate } from '~/utils/groupByDate'
import { useMediaQuery } from '~/utils/useMediaQuery'

function groupDueByDate(items: Array<ReviewCardQueueItem>) {
	const byDate = new Map<string, Array<ReviewCardQueueItem>>()

	for (const item of items) {
		const key = item.scheduled_at ?? 'unscheduled'
		if (!byDate.has(key)) byDate.set(key, [])
		byDate.get(key)!.push(item)
	}

	return [...byDate.entries()]
		.sort(([a], [b]) => {
			if (a === 'unscheduled') return 1
			if (b === 'unscheduled') return -1
			return a.localeCompare(b)
		})
		.map(([dateKey, groupedItems]) => ({
			id: dateKey,
			label:
				dateKey === 'unscheduled'
					? 'Unscheduled'
					: dayjs(dateKey).format('dddd, MMM D'),
			items: groupedItems
		}))
}

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
	const isFocusedDueView = activeTab === 'due' && scope === 'focused'
	const usesDesktopFocusedLayout = useMediaQuery('(min-width: 1280px)')
	const { data: items = [], isLoading } = useReviewCardQueue({
		type: 'practice',
		tab: activeTab,
		focused: activeTab === 'due' ? scope === 'focused' : undefined
	})

	const dueSections = useMemo(() => groupDueByDate(items), [items])
	const focusedRows = useMemo(
		() => groupFocusedPracticeRows(items, usesDesktopFocusedLayout),
		[items, usesDesktopFocusedLayout]
	)
	const newSections = useMemo(
		() =>
			groupByDate(
				items.map(item => ({
					item,
					date: item.card.inserted_at
				}))
			),
		[items]
	)

	function renderQueueMasonry(queueItems: Array<ReviewCardQueueItem>) {
		return (
			<MasonryLayout
				estimateItemSize={(item, _index, laneWidth) =>
					estimateReviewCardSize(item.card, laneWidth)
				}
				gap={DEFAULT_MASONRY_GAP}
				getItemKey={item => `${item.card.id}-${item.review_id ?? 'new'}`}
				items={queueItems}
				minItemWidth={DEFAULT_MASONRY_MIN_ITEM_WIDTH}
				renderItem={item => (
					<div className='space-y-2'>
						<ReviewCard
							onClick={() =>
								navigate({
									to: '/review-cards/$reviewCardId',
									params: { reviewCardId: item.card.id.toString() }
								})
							}
							reviewCard={item.card}
						/>
					</div>
				)}
			/>
		)
	}

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
									minHeight={380}
									onClick={() =>
										navigate({
											to: '/review-cards/$reviewCardId',
											params: { reviewCardId: item.card.id.toString() }
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
		content = sections.map(section => (
			<div className='space-y-3' key={section.id}>
				<h3 className='flex items-center gap-2 font-bold text-xl'>
					{section.label}
					<CountBadge count={section.items.length} />
				</h3>
				{renderQueueMasonry(section.items)}
			</div>
		))
	}

	let contentClassName = 'max-w-screen space-y-6 p-6'
	if (isFocusedDueView) {
		contentClassName =
			'flex max-w-screen min-h-0 flex-1 flex-col gap-4 px-3 pt-3 pb-4 sm:px-6 sm:pt-3 sm:pb-6'
	} else if (activeTab === 'due') {
		contentClassName = 'max-w-screen space-y-6 px-6 pt-3 pb-6'
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={ListChecks} title='Practice'>
				<div className='flex justify-start'>
					<Tabs
						className='-mb-2'
						onValueChange={value => {
							if (value === 'due' || value === 'new') onActiveTabChange(value)
						}}
						value={activeTab}
					>
						<TabsList className='border-b-0' variant='line'>
							<TabsTrigger value='due'>Due</TabsTrigger>
							<TabsTrigger value='new'>New</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</PageLayout.Header>
			<PageLayout.Content className={contentClassName}>
				{activeTab === 'due' ? (
					<div className='relative flex min-h-0 flex-1 flex-col'>
						<Tabs
							className='pointer-events-none absolute top-0 left-0 z-10 w-full items-start'
							onValueChange={value => {
								if (value === 'focused' || value === 'all') {
									onScopeChange(value)
								}
							}}
							value={scope}
						>
							<TabsList className='pointer-events-auto'>
								<TabsTrigger value='focused'>Focused</TabsTrigger>
								<TabsTrigger value='all'>All</TabsTrigger>
							</TabsList>
						</Tabs>
						<div
							className={cn(
								'min-h-0 flex-1',
								isFocusedDueView
									? 'pt-14 xl:flex xl:items-center xl:justify-center xl:pt-0'
									: 'pt-14'
							)}
						>
							{content}
						</div>
					</div>
				) : null}
				{activeTab === 'new' ? content : null}
			</PageLayout.Content>
		</PageLayout>
	)
}
