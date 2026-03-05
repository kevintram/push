import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Layers } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageLayout } from '~/app/layouts/PageLayout'
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

export function FlashcardsPage() {
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState<'due' | 'new'>('due')
	const [scope, setScope] = useState<'focused' | 'all'>('focused')

	const { data: items = [], isLoading } = useReviewCardQueue({
		type: 'flashcard',
		tab: activeTab,
		focused: scope === 'focused'
	})
	const createReviewMutation = useCreateReview()

	const activeCard = useMemo(() => items[0]?.card ?? null, [items])
	const dueSections = useMemo(() => groupDueByDate(items), [items])

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

	async function markCard(
		reviewCardId: number,
		rating: 'miss' | 'hard' | 'good' | 'easy'
	) {
		try {
			await createReviewMutation.mutateAsync({
				review_card_id: reviewCardId,
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
	} else if (scope === 'focused' && activeCard) {
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
					readOnly={true}
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
	} else if (scope === 'all') {
		content =
			activeTab === 'due' ? (
				dueSections.map(section => (
					<div className='space-y-3' key={section.id}>
						<h3 className='flex items-center gap-2 font-bold text-xl'>
							{section.label}
							<CountBadge count={section.items.length} />
						</h3>
						<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
							{section.items.map(item => (
								<div key={`${item.card.id}-${item.review_id ?? 'new'}`}>
									<ReviewCard
										onClick={() =>
											navigate({
												to: '/review-cards/$reviewCardId',
												params: { reviewCardId: item.card.id.toString() }
											})
										}
										readOnly={true}
										reviewCard={item.card}
									/>
								</div>
							))}
						</div>
					</div>
				))
			) : (
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{items.map(item => (
						<div key={item.card.id}>
							<ReviewCard
								onClick={() =>
									navigate({
										to: '/review-cards/$reviewCardId',
										params: { reviewCardId: item.card.id.toString() }
									})
								}
								readOnly={true}
								reviewCard={item.card}
							/>
						</div>
					))}
				</div>
			)
	} else if (activeTab === 'due') {
		content = dueSections.map(section => (
			<div className='space-y-3' key={section.id}>
				<h3 className='flex items-center gap-2 font-bold text-xl'>
					{section.label}
					<CountBadge count={section.items.length} />
				</h3>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{section.items.map(item => (
						<div
							className='space-y-2'
							key={`${item.card.id}-${item.review_id ?? 'new'}`}
						>
							<ReviewCard
								onClick={() =>
									navigate({
										to: '/review-cards/$reviewCardId',
										params: { reviewCardId: item.card.id.toString() }
									})
								}
								readOnly={true}
								reviewCard={item.card}
							/>
							<div className='flex items-center gap-2'>
								<Button
									onClick={() => markCard(item.card.id, 'hard')}
									size='xs'
									variant='outline'
								>
									Hard
								</Button>
								<Button
									onClick={() => markCard(item.card.id, 'good')}
									size='xs'
									variant='outline'
								>
									Good
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>
		))
	} else {
		content = (
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{items.map(item => (
					<div className='space-y-2' key={item.card.id}>
						<ReviewCard
							onClick={() =>
								navigate({
									to: '/review-cards/$reviewCardId',
									params: { reviewCardId: item.card.id.toString() }
								})
							}
							readOnly={true}
							reviewCard={item.card}
						/>
						<div className='flex items-center gap-2'>
							<Button onClick={() => markCard(item.card.id, 'good')} size='xs'>
								Mark Reviewed
							</Button>
						</div>
					</div>
				))}
			</div>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={Layers} title='Flashcards'>
				<div className='flex flex-col items-start gap-1'>
					<Tabs
						onValueChange={value => {
							if (value === 'due' || value === 'new') setActiveTab(value)
						}}
						value={activeTab}
					>
						<TabsList>
							<TabsTrigger value='due'>Due</TabsTrigger>
							<TabsTrigger value='new'>New</TabsTrigger>
						</TabsList>
					</Tabs>
					<Tabs
						onValueChange={value => {
							if (value === 'focused' || value === 'all') setScope(value)
						}}
						value={scope}
					>
						<TabsList variant='line'>
							<TabsTrigger value='focused'>Focused</TabsTrigger>
							<TabsTrigger value='all'>All</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</PageLayout.Header>
			<PageLayout.Content className='max-w-screen space-y-6 p-6'>
				{content}
			</PageLayout.Content>
		</PageLayout>
	)
}
