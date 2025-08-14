import { ArchiveRestore } from 'lucide-react'
import { Badge } from '~/components/ui/Badge'
import { Progress } from '~/components/ui/Progress'
import type { ReviewSession } from '~/types/topics.types'
import { numDaysElapsed } from '../utils/daysElapsed'

export function ReviewSidebar({
	reviewHistory
}: {
	reviewHistory: Array<ReviewSession>
}) {
	return (
		<div className='flex h-full flex-col gap-3 p-4'>
			<div className='flex items-center gap-2 border-b pb-2'>
				<h1 className='font-semibold'>Review</h1>
			</div>

			<div className='flex min-h-0 flex-1 flex-col'>
				<div className='flex-1 space-y-4 overflow-auto'>
					{reviewHistory.map((session, index) => (
						<Session
							index={index}
							isLastEntry={index === reviewHistory.length - 1}
							key={index}
							nextSession={
								index < reviewHistory.length - 1
									? reviewHistory[index + 1]
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

function Session({
	reviewSession,
	index,
	isLastEntry,
	nextSession
}: {
	reviewSession: ReviewSession
	index: number
	isLastEntry: boolean
	nextSession: ReviewSession | undefined
}) {
	const daysElapsed = nextSession
		? numDaysElapsed(reviewSession.date, nextSession.date)
		: null
	const stabilityChange =
		reviewSession.stabilityAfter - reviewSession.stabilityBefore
	const reviewedItemsCount = reviewSession.practiceReviewed.length
	const retrievability = reviewSession.retrievabilityBefore

	return (
		<div className='relative flex gap-3'>
			<div className='flex flex-col items-center'>
				<div className='flex items-center gap-2'>
					<div className='font-medium text-muted-foreground text-xs'>
						{index + 1}
					</div>

					<Badge variant='default'>
						{reviewSession.date.toLocaleDateString()}
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
						<Progress
							className='flex-1'
							value={reviewSession.stabilityBefore}
						/>
						<span className='font-medium text-muted-foreground text-xs'>
							{reviewSession.stabilityBefore} days
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
					<div className='text-foreground text-xs'>
						{reviewedItemsCount} card{reviewedItemsCount !== 1 ? 's' : ''}{' '}
						reviewed
					</div>

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
