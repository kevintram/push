import { useCallback, useMemo } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Skeleton } from '~/components/ui/Skeleton'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Tables } from '~/types/database.types'

const MIN_CARD_WIDTH = 280
const MIN_CARD_HEIGHT = 168
const CHARS_PER_LINE = 36
const LINE_HEIGHT = 18
const BASE_HEIGHT = 140

export function InboxList({
	topics,
	onTopicSelect,
	isLoading
}: {
	topics: Array<Tables<'topics'>> | undefined | null
	onTopicSelect: (topic: Tables<'topics'>) => void
	isLoading: boolean
}) {
	const topicList = useMemo(() => topics ?? [], [topics])

	const estimateItemSize = useCallback((topic: Tables<'topics'>) => {
		const nameLength = topic.name?.length ?? 0
		const notesLength = topic.notes?.length ?? 0

		const nameLines = Math.max(1, Math.ceil(nameLength / CHARS_PER_LINE))
		const notesLines =
			notesLength > 0 ? Math.ceil(notesLength / CHARS_PER_LINE) : 0

		const height =
			BASE_HEIGHT + (nameLines - 1) * LINE_HEIGHT + notesLines * LINE_HEIGHT

		return Math.max(height, MIN_CARD_HEIGHT)
	}, [])

	const renderItem = useCallback(
		(topic: Tables<'topics'>) => (
			<TopicCard onTopicClick={onTopicSelect} topic={topic} />
		),
		[onTopicSelect]
	)

	const getItemKey = useCallback((topic: Tables<'topics'>) => topic.id, [])

	if (isLoading) {
		return (
			<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						className='space-y-3 rounded-lg border p-4'
						key={`skeleton-${index}`}
					>
						<Skeleton className='h-5 w-3/4' />
						<Skeleton className='h-4 w-5/6' />
						<Skeleton className='h-4 w-2/3' />
						<div className='flex justify-end'>
							<Skeleton className='h-8 w-24' />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (topicList.length === 0) {
		return (
			<div className='flex flex-1 items-center justify-center py-12'>
				<div className='text-center text-muted-foreground'>
					<p className='font-medium text-lg'>Your inbox is empty</p>
					<p className='text-sm'>Create your first quick entry topic above</p>
				</div>
			</div>
		)
	}

	return (
		<MasonryLayout
			estimateItemSize={estimateItemSize}
			gap={16}
			getItemKey={getItemKey}
			items={topicList}
			minItemWidth={MIN_CARD_WIDTH}
			overscan={6}
			renderItem={renderItem}
		/>
	)
}
