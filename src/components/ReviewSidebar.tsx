import { ArchiveRestore } from 'lucide-react'
import type { Topic } from '~/types/topic-hub'
import { Badge } from './ui/Badge'
import { Progress } from './ui/Progress'

interface ReviewSidebarProps {
	topic: Topic
}

interface ProcessedReviewEntry {
	entry: NonNullable<Topic['reviewHistory']>[number]
	index: number
	stabilityChange: number
	reviewedItemsCount: number
	daysElapsed: number | null
	isLastEntry: boolean
}

export function ReviewSidebar({ topic }: ReviewSidebarProps) {
	const processedEntries = useProcessedReviewHistory(topic)

	return (
		<div className='flex flex-col h-full gap-3 p-4'>
			<ReviewHeader />
			<ReviewTimeline entries={processedEntries} />
		</div>
	)
}

function useProcessedReviewHistory(topic: Topic): ProcessedReviewEntry[] {
	const sortedHistory =
		topic.reviewHistory
			?.slice()
			.sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
			) || []

	return sortedHistory.map((entry, index) => {
		const stabilityAfter = entry.stabilityAfter || entry.stabilityAtTheTime
		const stabilityBefore = entry.stabilityBefore || entry.stabilityAtTheTime
		const stabilityChange = stabilityAfter - stabilityBefore

		const reviewedItemsCount = topic.practiceItems.filter(item =>
			entry.practiceItemsReviewed?.includes(item.id)
		).length

		const nextEntry =
			index < sortedHistory.length - 1 ? sortedHistory[index + 1] : null
		const daysElapsed = nextEntry
			? Math.round(
					(new Date(nextEntry.date).getTime() -
						new Date(entry.date).getTime()) /
						(1000 * 60 * 60 * 24)
				)
			: null

		return {
			entry,
			index,
			stabilityChange,
			reviewedItemsCount,
			daysElapsed,
			isLastEntry: index === sortedHistory.length - 1
		}
	})
}

function ReviewHeader() {
	return (
		<div className='flex items-center gap-2 pb-2 border-b'>
			<h1 className='font-semibold'>Review</h1>
		</div>
	)
}

function ReviewTimeline({ entries }: { entries: ProcessedReviewEntry[] }) {
	return (
		<div className='flex-1 flex flex-col min-h-0'>
			<div className='flex-1 space-y-4 overflow-auto'>
				{entries.map(processedEntry => (
					<ReviewEntry
						key={`${processedEntry.entry.date.toISOString()}-${processedEntry.index}`}
						{...processedEntry}
					/>
				))}
			</div>
		</div>
	)
}

function ReviewEntry({
	entry,
	index,
	stabilityChange,
	reviewedItemsCount,
	daysElapsed,
	isLastEntry
}: ProcessedReviewEntry) {
	return (
		<div className='flex gap-3 relative'>
			<div className='flex flex-col items-center'>
				<div className='flex items-center gap-2'>
					<div className='text-xs font-medium text-muted-foreground'>
						{index + 1}
					</div>
					<Badge variant='default'>{entry.date.toLocaleDateString()}</Badge>
				</div>
				{!isLastEntry && (
					<>
						<div className='w-px bg-border flex-1 mt-2 min-h-12'></div>
						{daysElapsed && (
							<div className='text-xs text-muted-foreground font-medium'>
								{daysElapsed}d later
							</div>
						)}
					</>
				)}
			</div>
			<div className='flex-1 pb-6'>
				<ReviewSessionHeader
					retrievability={entry.retrievabilityAtTheTime}
					stability={entry.stabilityAtTheTime}
				/>
				<ReviewSessionBody
					daysElapsed={daysElapsed}
					reviewedItemsCount={entry.practiceItemsReviewed.length}
					stabilityChange={stabilityChange}
				/>
			</div>
		</div>
	)
}

function ReviewSessionHeader({
	retrievability,
	stability
}: {
	retrievability: number
	stability: number
}) {
	return (
		<div className='mb-3'>
			<div className='flex items-center gap-2 mb-2'>
				<Progress value={stability} className='flex-1' />
				<span className='text-xs font-medium text-muted-foreground'>
					{stability} days
				</span>
			</div>
			<div className='flex items-center gap-2'>
				<div className='flex items-center gap-1 text-xs text-muted-foreground'>
					<ArchiveRestore className='h-3 w-3' />
					<span>{retrievability}%</span>
				</div>
			</div>
		</div>
	)
}

function ReviewSessionBody({
	daysElapsed,
	reviewedItemsCount,
	stabilityChange
}: {
	daysElapsed: number | null
	reviewedItemsCount: number
	stabilityChange: number
}) {
	return (
		<div className='space-y-2'>
			<div className='text-xs text-foreground'>
				{reviewedItemsCount} card{reviewedItemsCount !== 1 ? 's' : ''} reviewed
			</div>
			<div className='flex items-center justify-between'>
				{stabilityChange !== 0 && (
					<div className={`text-xs font-medium ${
						stabilityChange > 0 ? 'text-green-600' : 'text-red-600'
					}`}>
						{stabilityChange > 0 ? '+' : ''}{stabilityChange}d stability
					</div>
				)}
			</div>
		</div>
	)
}
