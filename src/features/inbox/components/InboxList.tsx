import { useVirtualizer } from '@tanstack/react-virtual'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState
} from 'react'
import { TopicCard } from '~/components/TopicCard'
import { Skeleton } from '~/components/ui/Skeleton'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import type { Tables } from '~/types/database.types'

const MIN_CARD_WIDTH = 280
const MIN_CARD_HEIGHT = 168
const CHARS_PER_LINE = 36
const LINE_HEIGHT = 18
const BASE_HEIGHT = 140
const GAP = 16

export function InboxList({
	topics,
	onTopicSelect,
	isLoading
}: {
	topics: Array<Tables<'topics'>> | undefined | null
	onTopicSelect: (topic: Tables<'topics'>) => void
	isLoading: boolean
}) {
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

	const topicList = useMemo(() => topics ?? [], [topics])

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

	const [parentRef, rect] = useResizeObserver<HTMLDivElement>()
	const [numLanes, setNumLanes] = useState(1)

	const estimateSize = useCallback(
		(index: number) => {
			const topic = topicList[index]
			if (!topic) return MIN_CARD_HEIGHT

			const nameLength = topic.name?.length ?? 0
			const notesLength = topic.notes?.length ?? 0

			const nameLines = Math.max(1, Math.ceil(nameLength / CHARS_PER_LINE))
			const notesLines =
				notesLength > 0 ? Math.ceil(notesLength / CHARS_PER_LINE) : 0

			const height =
				BASE_HEIGHT + (nameLines - 1) * LINE_HEIGHT + notesLines * LINE_HEIGHT

			return Math.max(height, MIN_CARD_HEIGHT)
		},
		[topicList]
	)

	const virtualizer = useVirtualizer({
		count: topicList.length,
		getScrollElement: () => parentRef.current,
		estimateSize,
		lanes: numLanes,
		overscan: 6,
		gap: GAP
	})

	useLayoutEffect(() => {
		virtualizer.measure()
	}, [virtualizer, numLanes])

	useEffect(() => {
		if (rect.width) {
			const calculatedLanes = Math.max(
				1,
				Math.floor((rect.width + GAP) / (MIN_CARD_WIDTH + GAP))
			)

			if (calculatedLanes !== numLanes) setNumLanes(calculatedLanes)
		}
	}, [rect.width, numLanes])

	return (
		<div
			className='relative'
			ref={parentRef}
			style={{
				height: `${virtualizer.getTotalSize()}px`,
				width: '100%'
			}}
		>
			{virtualizer.getVirtualItems().map(virtualItem => {
				const topic = topicList[virtualItem.index]!

				return (
					<div
						className='absolute top-0'
						data-index={virtualItem.index}
						key={virtualItem.key}
						ref={virtualizer.measureElement}
						style={{
							left: `${virtualItem.lane * (100 / numLanes)}%`,
							width: `calc(${100 / numLanes}% - ${virtualItem.lane === numLanes - 1 ? 0 : GAP}px)`,
							transform: `translateY(${virtualItem.start}px)`
						}}
					>
						<TopicCard onTopicClick={onTopicSelect} topic={topic} />
					</div>
				)
			})}
		</div>
	)
}
