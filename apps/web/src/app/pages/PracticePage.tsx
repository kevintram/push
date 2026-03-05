import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { ListChecks } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
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

export function PracticePage() {
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState<'due' | 'new'>('due')
	const [scope, setScope] = useState<'focused' | 'all'>('all')
	const { data: items = [], isLoading } = useReviewCardQueue({
		type: 'practice',
		tab: activeTab,
		focused: scope === 'focused'
	})

	const dueSections = useMemo(() => groupDueByDate(items), [items])

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
	} else if (scope === 'focused') {
		content = (
			<div className='flex min-h-[calc(100vh-12rem)] items-center'>
				<div className='mx-auto flex w-full max-w-6xl flex-wrap justify-center gap-4'>
					{items.map(item => (
						<div
							className='w-full max-w-md space-y-2 sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]'
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
						</div>
					))}
				</div>
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
					</div>
				))}
			</div>
		)
	}

	return (
		<PageLayout>
			<PageLayout.Header icon={ListChecks} title='Practice'>
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
