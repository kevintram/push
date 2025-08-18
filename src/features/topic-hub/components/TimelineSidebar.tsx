import { ArchiveRestore } from 'lucide-react'
import { use } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Progress } from '~/components/ui/Progress'
import type { TimelineEntry } from '~/types/topics.types'
import { SelectedTopicContext } from '../stores/SelectedTopicContext'
import { numDaysElapsed } from '../utils/daysElapsed'

export function TimelineSidebar() {
	const { selectedTopic } = use(SelectedTopicContext)

	return (
		<div className='flex h-full flex-col gap-3 p-4'>
			<div className='flex items-center gap-2 border-b pb-2'>
				<h1 className='font-semibold'>Timeline</h1>
			</div>

			<div className='flex min-h-0 flex-1 flex-col'>
				<div className='flex-1 space-y-4 overflow-auto'>
					{selectedTopic?.timeline_entries.map((session, index) => (
						<Entry
							index={index}
							isLastEntry={index === selectedTopic?.timeline_entries.length - 1}
							key={index}
							nextSession={
								index < selectedTopic?.timeline_entries.length - 1
									? selectedTopic?.timeline_entries[index + 1]
									: undefined
							}
							reviewSession={session}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

function Entry({
	reviewSession,
	index,
	isLastEntry,
	nextSession
}: {
	reviewSession: TimelineEntry
	index: number
	isLastEntry: boolean
	nextSession: TimelineEntry | undefined
}) {
	const daysElapsed = nextSession
		? numDaysElapsed(
				new Date(reviewSession.review_date),
				new Date(nextSession.review_date)
			)
		: null
	const stabilityChange = reviewSession.stability_change
	// TODO: Implement count based on timeline_entry_practice_cards
	// const reviewedItemsCount = 0
	const retrievability = reviewSession.retrievability

	return (
		<div className='relative flex gap-3'>
			<div className='flex flex-col items-center'>
				<div className='flex items-center gap-2'>
					<div className='font-medium text-muted-foreground text-xs'>
						{index + 1}
					</div>

					<Badge variant='default'>
						{new Date(reviewSession.review_date).toLocaleDateString()}
					</Badge>
				</div>

				{!isLastEntry && (
					<>
						<div className='mt-2 min-h-12 w-px flex-1 bg-border' />
						{daysElapsed && (
							<div className='font-medium text-muted-foreground text-xs'>
								{daysElapsed}d later
							</div>
						)}
					</>
				)}
			</div>
			<div className='flex-1 pb-6'>
				<div className='mb-3'>
					<div className='mb-2 flex items-center gap-2'>
						<Progress className='flex-1' value={reviewSession.stability} />
						<span className='font-medium text-muted-foreground text-xs'>
							{reviewSession.stability} days
						</span>
					</div>

					<div className='flex items-center gap-2'>
						<div className='flex items-center gap-1 text-muted-foreground text-xs'>
							<ArchiveRestore className='h-3 w-3' />
							<span>{(retrievability * 100).toFixed(0)}%</span>
						</div>
					</div>
				</div>

				<div className='space-y-2'>
					{/* TODO: fix this when you implement practice cards and shit */}
					{/* <div className='text-foreground text-xs'>
						{reviewedItemsCount} card{reviewedItemsCount !== 1 ? 's' : ''}{' '}
						reviewed
					</div> */}

					<div className='flex items-center justify-between'>
						{stabilityChange !== 0 && (
							<div
								className={`font-medium text-xs ${
									stabilityChange > 0 ? 'text-green-600' : 'text-red-600'
								}`}
							>
								{stabilityChange > 0 ? '+' : ''}
								{stabilityChange}d stability
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
