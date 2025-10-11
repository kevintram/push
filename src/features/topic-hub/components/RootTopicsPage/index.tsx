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
import { TopicCard } from '~/components/TopicCard'
import { Button } from '~/components/ui/Button'
import { useTopicsWithRelationships } from '~/features/topic-hub/hooks/useTopicsWithRelationships'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'

const MIN_CARD_WIDTH = 280
const MIN_HEIGHT = 96
const GAP = 16

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

	// Filter: Root topics = topics NOT in descendants
	const rootTopics = useMemo(() => {
		if (!(allTopics && descendants)) return []
		const descendantIds = new Set(descendants.map(d => d.descendant))
		return allTopics.filter(topic => !descendantIds.has(topic.id))
	}, [allTopics, descendants])

	// Get root topic IDs
	const rootTopicIds = useMemo(() => rootTopics.map(t => t.id), [rootTopics])

	// Enrich root topics with relationships
	const { topics: enrichedTopics, isLoading: relationshipsLoading } =
		useTopicsWithRelationships(rootTopicIds)

	const isLoading = topicsLoading || descendantsLoading || relationshipsLoading

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

	const topics = enrichedTopics || []

	const handleCreateTopic = useCallback(() => {
		insertTopicMutation([{}])
	}, [insertTopicMutation])

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/{-$topicId}',
				params: { topicId: topic.id.toString() }
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
				Math.floor((rect.width + GAP) / (MIN_CARD_WIDTH + GAP))
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
			<div className='container mx-auto'>
				<div className='sticky top-0 z-10 bg-background/95 p-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
					<div className='flex items-center gap-3'>
						<SquareLibrary className='h-6 w-6' />
						<h1 className='font-bold text-3xl'>Library</h1>
					</div>
				</div>
				<div className='flex flex-1 items-center justify-center px-6 pb-6'>
					<p className='text-muted-foreground'>Loading topics...</p>
				</div>
			</div>
		)
	}

	if (topics.length === 0) {
		return (
			<div className='container mx-auto'>
				<div className='sticky top-0 z-10 bg-background/95 p-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
					<div className='flex items-center gap-3'>
						<SquareLibrary className='h-6 w-6' />
						<h1 className='font-bold text-3xl'>Library</h1>
					</div>
				</div>
				<div className='flex flex-1 items-center justify-center px-6 pb-6'>
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
		<div className='container mx-auto'>
			<div className='sticky top-0 z-10 bg-background/95 p-6 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='flex items-center gap-3'>
					<SquareLibrary className='h-6 w-6' />
					<h1 className='font-bold text-3xl'>Library</h1>
				</div>
			</div>

			<div className='px-6 pb-6'>
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
									onTopicClick={handleTopicClick}
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
