import { Link } from '@tanstack/react-router'
import {
	Calendar,
	ChevronRight,
	CircleDashed,
	History,
	LayoutGrid,
	Play,
	Star
} from 'lucide-react'
import { useMemo } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/Card'
import { Skeleton } from '~/components/ui/Skeleton'
import {
	useSoonReviewEntries,
	useTodayReviewEntries,
	useUnscheduledReviewEntries
} from '~/features/reviews/api/getReviewEntries'
import { useTopics } from '~/features/topics/api/getTopics'
import { getRetrievabilityBucket } from '~/utils/retrievability'

export function HomePage() {
	return (
		<PageLayout>
			<PageLayout.Header icon={LayoutGrid} title='Home' />
			<PageLayout.Content className='max-w-4xl'>
				<div className='grid gap-4 md:grid-cols-2'>
					<ReviewCard />
					<TodayCard />
					<ScheduledCard />
					<UnscheduledCard />
					<RecentCard />
				</div>
			</PageLayout.Content>
		</PageLayout>
	)
}

function ReviewCard() {
	const { data: topics, isLoading } = useTopics({
		hasStability: true,
		srsEnabled: true,
		archived: false
	})

	const counts = useMemo(() => {
		if (!topics) return { late: 0, onTime: 0, early: 0, total: 0 }

		let late = 0
		let onTime = 0
		let early = 0

		for (const topic of topics) {
			if (topic.retrievability === null) continue
			const bucket = getRetrievabilityBucket(topic.retrievability)
			switch (bucket) {
				case 'late':
					late++
					break
				case 'onTime':
					onTime++
					break
				case 'early':
					early++
					break
			}
		}

		return { late, onTime, early, total: late + onTime + early }
	}, [topics])

	return (
		<Link className='group' to='/review'>
			<Card className='h-full transition-colors hover:bg-accent/50'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Play className='h-5 w-5 text-muted-foreground' />
							<CardTitle>Review</CardTitle>
						</div>
						<ChevronRight className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
					</div>
					<CardDescription>Topics ready for review</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex gap-4'>
							<Skeleton className='h-8 w-16' />
							<Skeleton className='h-8 w-16' />
							<Skeleton className='h-8 w-16' />
						</div>
					) : counts.total === 0 ? (
						<p className='text-muted-foreground text-sm'>
							No topics ready for review
						</p>
					) : (
						<div className='flex flex-wrap gap-4'>
							{counts.late > 0 && (
								<div>
									<span className='font-bold text-2xl text-red-600 dark:text-red-400'>
										{counts.late}
									</span>
									<span className='ml-1 text-muted-foreground text-sm'>
										late
									</span>
								</div>
							)}
							{counts.onTime > 0 && (
								<div>
									<span className='font-bold text-2xl text-blue-600 dark:text-blue-400'>
										{counts.onTime}
									</span>
									<span className='ml-1 text-muted-foreground text-sm'>
										ready
									</span>
								</div>
							)}
							{counts.early > 0 && (
								<div>
									<span className='font-bold text-2xl text-green-600 dark:text-green-400'>
										{counts.early}
									</span>
									<span className='ml-1 text-muted-foreground text-sm'>
										early
									</span>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}

function TodayCard() {
	const { sections, isLoading } = useTodayReviewEntries()

	const counts = useMemo(() => {
		const overdueSection = sections.find(s => s.id === 'overdue')
		const todaySection = sections.find(s => s.id === 'today')
		const overdue = overdueSection?.entries.length ?? 0
		const today = todaySection?.entries.length ?? 0
		return { overdue, today, total: overdue + today }
	}, [sections])

	return (
		<Link className='group' to='/today'>
			<Card className='h-full transition-colors hover:bg-accent/50'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Star className='h-5 w-5 text-muted-foreground' />
							<CardTitle>Today</CardTitle>
						</div>
						<ChevronRight className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
					</div>
					<CardDescription>Reviews due today</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex gap-4'>
							<Skeleton className='h-8 w-16' />
							<Skeleton className='h-8 w-16' />
						</div>
					) : counts.total === 0 ? (
						<p className='text-muted-foreground text-sm'>Nothing due today</p>
					) : (
						<div className='flex flex-wrap gap-4'>
							{counts.overdue > 0 && (
								<div>
									<span className='font-bold text-2xl text-red-600'>
										{counts.overdue}
									</span>
									<span className='ml-1 text-muted-foreground text-sm'>
										overdue
									</span>
								</div>
							)}
							{counts.today > 0 && (
								<div>
									<span className='font-bold text-2xl'>{counts.today}</span>
									<span className='ml-1 text-muted-foreground text-sm'>
										today
									</span>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}

function ScheduledCard() {
	const { sections, isLoading } = useSoonReviewEntries()

	const counts = useMemo(() => {
		const tomorrowSection = sections.find(s => s.id === 'tomorrow')
		const nextWeekSection = sections.find(s => s.id === 'nextSevenDays')
		const tomorrow = tomorrowSection?.entries.length ?? 0
		const nextWeek = nextWeekSection?.entries.length ?? 0
		return { tomorrow, nextWeek, total: tomorrow + nextWeek }
	}, [sections])

	return (
		<Link className='group' to='/upcoming'>
			<Card className='h-full transition-colors hover:bg-accent/50'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Calendar className='h-5 w-5 text-muted-foreground' />
							<CardTitle>Upcoming</CardTitle>
						</div>
						<ChevronRight className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
					</div>
					<CardDescription>Upcoming reviews</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex gap-4'>
							<Skeleton className='h-8 w-16' />
							<Skeleton className='h-8 w-16' />
						</div>
					) : counts.total === 0 ? (
						<p className='text-muted-foreground text-sm'>No upcoming reviews</p>
					) : (
						<div className='flex flex-wrap gap-4'>
							{counts.tomorrow > 0 && (
								<div>
									<span className='font-bold text-2xl'>{counts.tomorrow}</span>
									<span className='ml-1 text-muted-foreground text-sm'>
										tomorrow
									</span>
								</div>
							)}
							{counts.nextWeek > 0 && (
								<div>
									<span className='font-bold text-2xl'>{counts.nextWeek}</span>
									<span className='ml-1 text-muted-foreground text-sm'>
										next week
									</span>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}

function UnscheduledCard() {
	const { section, isLoading } = useUnscheduledReviewEntries()
	const count = section.entries.length

	return (
		<Link className='group' to='/unscheduled'>
			<Card className='h-full transition-colors hover:bg-accent/50'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<CircleDashed className='h-5 w-5 text-muted-foreground' />
							<CardTitle>Unscheduled</CardTitle>
						</div>
						<ChevronRight className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
					</div>
					<CardDescription>Reviews without a schedule</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className='h-8 w-16' />
					) : count === 0 ? (
						<p className='text-muted-foreground text-sm'>
							No unscheduled reviews
						</p>
					) : (
						<div>
							<span className='font-bold text-2xl'>{count}</span>
							<span className='ml-1 text-muted-foreground text-sm'>
								unscheduled
							</span>
						</div>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}

function RecentCard() {
	const { data: topics, isLoading } = useTopics({
		order: 'desc',
		limit: 5
	})

	return (
		<Link className='group md:col-span-2' to='/recent'>
			<Card className='h-full transition-colors hover:bg-accent/50'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<History className='h-5 w-5 text-muted-foreground' />
							<CardTitle>Recent</CardTitle>
						</div>
						<ChevronRight className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
					</div>
					<CardDescription>Recently viewed topics</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='space-y-2'>
							<Skeleton className='h-5 w-48' />
							<Skeleton className='h-5 w-40' />
							<Skeleton className='h-5 w-44' />
						</div>
					) : !topics || topics.length === 0 ? (
						<p className='text-muted-foreground text-sm'>No recent topics</p>
					) : (
						<ul className='space-y-1'>
							{topics.slice(0, 5).map(topic => (
								<li
									className='truncate text-muted-foreground text-sm'
									key={topic.id}
								>
									{topic.name || <span className='italic'>Untitled topic</span>}
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}
