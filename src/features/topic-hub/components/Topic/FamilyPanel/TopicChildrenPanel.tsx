import { useVirtualizer } from '@tanstack/react-virtual'
import { Baby, Plus } from 'lucide-react'
import {
	use,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState
} from 'react'
import { TopicCard } from '~/components/TopicCard'
import { Card, CardContent } from '~/components/ui/Card'
import { useCreateRelationship } from '~/features/topic-hub/hooks/useCreateRelationship'
import { useDeleteRelationship } from '~/features/topic-hub/hooks/useDeleteRelationship'
import { TopicContext } from '~/features/topic-hub/stores/SelectedTopicContext'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { AddRelationshipDialog } from '../AddRelationshipDialog'

const MIN_WIDTH = 192
const MIN_HEIGHT = 96
const GAP = 12

export function TopicChildrenPanel() {
	const [numLanes, setNumLanes] = useState(1)
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const parentRef = useRef<HTMLDivElement>(null)
	const { topic: selectedTopic, onTopicChange } = use(TopicContext)

	const children = selectedTopic?.children || []

	const createRelationship = useCreateRelationship()

	const handleAddChild = useCallback(() => {
		setShowCreateDialog(true)
	}, [])

	const handleTopicCreated = useCallback(
		async (topic: Tables<'topics'>) => {
			if (!selectedTopic) return

			try {
				// Create parent-child relationship
				await createRelationship.mutateAsync({
					parent: selectedTopic.id,
					child: topic.id
				})
			} catch (_error) {}
		},
		[selectedTopic, createRelationship]
	)

	const handleChildClick = useCallback(
		(child: Topic) => {
			if (onTopicChange) {
				onTopicChange(child)
			}
		},
		[onTopicChange]
	)

	const estimateSize = useCallback(
		(index: number) => {
			// Add button is always at index 0
			if (index === 0) return 60

			// Estimate height based on topic name and notes length
			const child = children[index - 1]
			if (!child) return MIN_HEIGHT

			const baseHeight = 80
			const lineHeight = 10
			const numCharsPerLine = 30
			const newLine = 10

			const nameHeight =
				Math.floor(child.name.length / numCharsPerLine) * lineHeight
			const notesHeight =
				Math.floor(child.notes.length / numCharsPerLine) * lineHeight

			const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

			return Math.max(calculatedHeight, MIN_HEIGHT)
		},
		[children]
	)

	// Masonry virtualization setup
	const virtualizer = useVirtualizer({
		count: children.length + 1, // +1 for add button
		getScrollElement: () => parentRef.current,
		estimateSize,
		overscan: 5,
		lanes: numLanes,
		gap: GAP
	})

	useLayoutEffect(() => {
		// trigger virtualizer to re-render when numLanes changes
		// ... i feel like there should be a better way to do this
		virtualizer.measure()
	}, [virtualizer, numLanes])

	// Calculate lanes based on container width
	useEffect(() => {
		const resizeObserver = new ResizeObserver(entries => {
			const containerWidth = entries[0]?.contentRect.width
			if (containerWidth) {
				const minLaneWidth = MIN_WIDTH

				const calculatedLanes = Math.max(
					1,
					Math.floor((containerWidth + GAP) / (minLaneWidth + GAP))
				)

				if (calculatedLanes !== numLanes) setNumLanes(calculatedLanes)
			}
		})

		if (parentRef.current) {
			resizeObserver.observe(parentRef.current)
		}

		return () => resizeObserver.disconnect()
	}, [numLanes])

	return (
		<>
			<div className='flex flex-col'>
				<div className='mb-3 flex items-center gap-2'>
					<Baby className='h-4 w-4' />
					<span className='font-medium text-muted-foreground text-xs'>
						Children
					</span>
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
							// Add button is at index 0
							if (virtualItem.index === 0) {
								return (
									<div
										className='absolute top-0'
										data-index={virtualItem.index}
										key='add-button'
										ref={virtualizer.measureElement}
										style={{
											left: `${virtualItem.lane * (100 / numLanes)}%`,
											width: `calc(${100 / numLanes}% - ${virtualItem.lane === numLanes - 1 ? 0 : GAP}px)`,
											transform: `translateY(${virtualItem.start}px)`
										}}
									>
										<Card
											className='cursor-pointer border-2 border-dashed transition-colors hover:bg-muted/50'
											onClick={handleAddChild}
										>
											<CardContent className='flex items-center justify-center p-3'>
												<Plus className='h-4 w-4 text-muted-foreground' />
											</CardContent>
										</Card>
									</div>
								)
							}

							const child = children[virtualItem.index - 1]!
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
									<ChildCard child={child} onChildClick={handleChildClick} />
								</div>
							)
						})}
					</div>
				</div>
			</div>

			<AddRelationshipDialog
				onOpenChange={setShowCreateDialog}
				onRelationshipCreated={handleTopicCreated}
				open={showCreateDialog}
				relationshipType='child'
				topicId={selectedTopic?.id}
			/>
		</>
	)
}

interface ChildCardProps {
	child: Topic
	onChildClick?: (child: Topic) => void
}

function ChildCard({ child, onChildClick }: ChildCardProps) {
	const { topic: selectedTopic } = use(TopicContext)
	const deleteRelationship = useDeleteRelationship()

	const handleRemoveRelationship = () => {
		if (!selectedTopic) return
		deleteRelationship.mutate({ parent: selectedTopic.id, child: child.id })
	}

	const handleClick = useCallback(
		(_topic: Tables<'topics'>) => {
			onChildClick?.(child)
		},
		[onChildClick, child]
	)

	return (
		<TopicCard
			minHeight={MIN_HEIGHT}
			onRemoveRelationship={handleRemoveRelationship}
			onTopicClick={handleClick}
			topic={child}
		/>
	)
}
