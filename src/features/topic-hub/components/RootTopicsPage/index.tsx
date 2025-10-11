import {
	useInsertMutation,
	useQuery
} from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Plus, SquareLibrary } from 'lucide-react'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState
} from 'react'
import { Button } from '~/components/ui/Button'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { TopicCard } from './TopicCard'

const MIN_WIDTH = 192
const MIN_HEIGHT = 96
const GAP = 12

export function RootTopicsPage() {
	const [numLanes, setNumLanes] = useState(1)
	const [parentRef, rect] = useResizeObserver()
	const navigate = useNavigate()

	// Query 1: All topics
	const { data: allTopics, isLoading: topicsLoading } = useQuery<
		Array<Tables<'topics'>>
	>(
		supabase
			.from('topics')
			.select('*')
			.order('inserted_at', { ascending: false })
	)

	// Query 2: All descendant IDs (topics that have parents)
	const { data: descendants, isLoading: descendantsLoading } = useQuery<
		Array<{ descendant: number }>
	>(supabase.from('topics_closure').select('descendant').eq('depth', 1))

	const isLoading = topicsLoading || descendantsLoading

	// Filter: Root topics = topics NOT in descendants
	const rootTopics = useMemo(() => {
		if (!(allTopics && descendants)) return []
		const descendantIds = new Set(descendants.map(d => d.descendant))
		return allTopics.filter(topic => !descendantIds.has(topic.id))
	}, [allTopics, descendants])

	const { mutateAsync: insertTopicMutation } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*',
		{
			onSuccess: data => {
				if (data?.[0]) {
					navigate({
						to: '/topics/{-$topicId}',
						params: { topicId: data[0].id.toString() }
					})
				}
			}
		}
	)

	const topics = rootTopics || []

	const handleCreateTopic = useCallback(() => {
		insertTopicMutation([{}])
	}, [insertTopicMutation])

	const handleTopicClick = useCallback(
		(topicId: number) => {
			navigate({
				to: '/topics/{-$topicId}',
				params: { topicId: topicId.toString() }
			})
		},
		[navigate]
	)

	const estimateSize = useCallback(
		(index: number) => {
			// Estimate height based on topic name and notes length
			const topic = topics[index]
			if (!topic) return MIN_HEIGHT

			const baseHeight = 80
			const lineHeight = 10
			const numCharsPerLine = 30
			const newLine = 10

			const nameHeight =
				Math.floor(topic.name.length / numCharsPerLine) * lineHeight
			const notesHeight =
				Math.floor(topic.notes.length / numCharsPerLine) * lineHeight

			const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

			return Math.max(calculatedHeight, MIN_HEIGHT)
		},
		[topics]
	)

	// Masonry virtualization setup
	const virtualizer = useVirtualizer({
		count: topics.length,
		getScrollElement: () => parentRef.current,
		estimateSize,
		overscan: 5,
		lanes: numLanes,
		gap: GAP
	})

	useEffect(() => {
		if (rect) {
			const calculatedLanes = Math.max(
				1,
				Math.floor((rect.width + GAP) / (MIN_WIDTH + GAP))
			)
			if (calculatedLanes !== numLanes) setNumLanes(calculatedLanes)
		}
	}, [rect, numLanes])

	useLayoutEffect(() => {
		// trigger virtualizer to re-render when numLanes changes
		virtualizer.measure()
	}, [virtualizer, numLanes])

	if (isLoading) {
		return (
			<div className='flex h-screen w-full flex-col p-6'>
				<div className='mb-6 flex items-center gap-3'>
					<SquareLibrary className='h-6 w-6' />
					<h1 className='font-bold text-2xl'>Library</h1>
				</div>
				<div className='flex flex-1 items-center justify-center'>
					<p className='text-muted-foreground'>Loading topics...</p>
				</div>
			</div>
		)
	}

	if (topics.length === 0) {
		return (
			<div className='flex h-screen w-full flex-col p-6'>
				<div className='mb-6 flex items-center gap-3'>
					<SquareLibrary className='h-6 w-6' />
					<h1 className='font-bold text-2xl'>Library</h1>
				</div>
				<div className='flex flex-1 items-center justify-center'>
					<div className='text-center'>
						<SquareLibrary className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
						<p className='mb-2 text-muted-foreground'>No root topics yet</p>
						<Button onClick={handleCreateTopic} variant='outline'>
							<Plus className='mr-2 h-4 w-4' />
							Create your first topic
						</Button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='flex h-screen w-full flex-col p-6'>
			<div className='mb-6 flex items-center gap-3'>
				<SquareLibrary className='h-6 w-6' />
				<h1 className='font-bold text-2xl'>Library</h1>
			</div>

			<div className='flex-1'>
				<div
					ref={parentRef}
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative'
					}}
				>
					{virtualizer.getVirtualItems().map(virtualItem => {
						const topic = topics[virtualItem.index]!
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
								<TopicCard
									minHeight={MIN_HEIGHT}
									onClick={() => handleTopicClick(topic.id)}
									topic={topic}
								/>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
