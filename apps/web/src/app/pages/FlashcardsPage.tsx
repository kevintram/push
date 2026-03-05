import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Layers } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { toast } from 'sonner'
import { PageLayout } from '~/app/layouts/PageLayout'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/button'
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
import { useCreateReview } from '~/features/reviews/api/createReview'
import { cn } from '~/lib/utils'
import {
	DEFAULT_MASONRY_GAP,
	DEFAULT_MASONRY_MIN_ITEM_WIDTH,
	estimateReviewCardSize
} from '~/utils/estimateMasonryItemSize'
import { groupByDate } from '~/utils/groupByDate'

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

export type FlashcardsTab = 'due' | 'new'
export type FlashcardsScope = 'focused' | 'all'

type FlashcardsPageProps = {
	activeTab: FlashcardsTab
	scope?: FlashcardsScope
	onActiveTabChange: (tab: FlashcardsTab) => void
	onScopeChange: (scope: FlashcardsScope) => void
}

export function FlashcardsPage({
	activeTab,
	scope = 'focused',
	onActiveTabChange,
	onScopeChange
}: FlashcardsPageProps) {
	const navigate = useNavigate()
	const isFocusedDueView = activeTab === 'due' && scope === 'focused'
	const { data: items = [], isLoading } = useReviewCardQueue({
		type: 'flashcard',
		tab: activeTab,
		focused: activeTab === 'due' ? scope === 'focused' : undefined
	})
	const createReviewMutation = useCreateReview()

	const activeCard = useMemo(() => items[0]?.card ?? null, [items])
	const dueSections = useMemo(() => groupDueByDate(items), [items])
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

	async function rateCard(rating: 'miss' | 'hard' | 'good' | 'easy') {
		if (!activeCard) return
		try {
			await createReviewMutation.mutateAsync({
				review_card_id: activeCard.id,
				rating,
				completed_at: dayjs().format('YYYY-MM-DD')
			})
		} catch {
			toast.error('Failed to record review')
		}
	}

	let content: ReactNode
	if (isLoading) {
		content = <LoadingSpinner containerClassName='min-h-64' />
	} else if (items.length === 0) {
		content = (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant='icon'>
						<Layers />
					</EmptyMedia>
					<EmptyTitle>No flashcards in this view</EmptyTitle>
				</EmptyHeader>
			</Empty>
		)
	} else if (isFocusedDueView && activeCard) {
		content = (
			<div className='mx-auto w-full max-w-3xl space-y-4'>
				<ReviewCard
					minHeight={380}
					onClick={() =>
						navigate({
							to: '/review-cards/$reviewCardId',
							params: { reviewCardId: activeCard.id.toString() }
						})
					}
					reviewCard={activeCard}
				/>
				<div className='flex flex-wrap items-center justify-center gap-2'>
					<Button onClick={() => rateCard('miss')} variant='outline'>
						Miss
					</Button>
					<Button onClick={() => rateCard('hard')} variant='outline'>
						Hard
					</Button>
					<Button onClick={() => rateCard('good')} variant='outline'>
						Good
					</Button>
					<Button onClick={() => rateCard('easy')} variant='outline'>
						Easy
					</Button>
				</div>
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

	const contentClassName = isFocusedDueView
		? 'flex max-w-screen min-h-0 flex-1 flex-col gap-4 px-3 pt-3 pb-4 sm:px-6 sm:pt-3 sm:pb-6'
		: activeTab === 'due'
			? 'max-w-screen space-y-6 px-6 pt-3 pb-6'
			: 'max-w-screen space-y-6 p-6'

	return (
		<PageLayout>
			<PageLayout.Header icon={Layers} title='Flashcards'>
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
								isFocusedDueView ? 'flex items-center justify-center' : 'pt-14'
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
