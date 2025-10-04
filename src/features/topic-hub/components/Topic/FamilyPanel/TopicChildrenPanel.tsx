import { useDeleteMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
	Baby,
	ExternalLink,
	GitPullRequestClosed,
	MoreHorizontal,
	Plus,
	Trash2
} from 'lucide-react'
import {
	use,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState
} from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useCreateRelationship } from '~/features/topic-hub/hooks/useCreateRelationship'
import { useDeleteRelationship } from '~/features/topic-hub/hooks/useDeleteRelationship'
import { TopicHubContext } from '~/features/topic-hub/stores/SelectedTopicContext'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { TopicDialog } from '~/components/TopicDialog'
import { AddRelationshipDialog } from '../AddRelationshipDialog'

const MIN_WIDTH = 192
const MIN_HEIGHT = 96
const GAP = 12

export function TopicChildrenPanel() {
	const [numLanes, setNumLanes] = useState(1)
	const [selectedChildTopic, setSelectedChildTopic] = useState<Topic | null>(
		null
	)
	const [showEditDialog, setShowEditDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const parentRef = useRef<HTMLDivElement>(null)
	const { selectedTopic } = use(TopicHubContext)

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

	const handleChildClick = useCallback((child: Topic) => {
		setSelectedChildTopic(child)
		setShowEditDialog(true)
	}, [])

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
				<TopicDialog
					onOpenChange={setShowEditDialog}
					open={showEditDialog}
					topic={selectedChildTopic}
				/>
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
	onChildClick: (child: Topic) => void
}

function ChildCard({ child, onChildClick }: ChildCardProps) {
	const { selectedTopic } = use(TopicHubContext)
	const deleteRelationship = useDeleteRelationship()
	const navigate = useNavigate()

	const { mutateAsync: deleteTopicMutation } = useDeleteMutation(
		supabase.from('topics'),
		['id']
	)

	const handleRemoveRelationship = () => {
		if (!selectedTopic) return
		deleteRelationship.mutate({ parent: selectedTopic.id, child: child.id })
	}

	const handleDeleteTopic = () => {
		deleteTopicMutation({ id: child.id })
	}

	const handleNavigate = () => {
		navigate({
			to: '/topics/{-$topicId}',
			params: { topicId: child.id.toString() }
		})
	}

	return (
		<Card className='group cursor-pointer p-0 transition-colors hover:bg-muted/50'>
			<CardContent
				className='flex h-full flex-col justify-between px-3 py-2'
				onClick={() => onChildClick(child)}
				style={{ minHeight: `${MIN_HEIGHT}px` }}
			>
				<div>
					{child.name && (
						<h3 className='mb-1 font-semibold text-md'>{child.name}</h3>
					)}
					<div className='line-clamp-5 text-sm'>{child.notes}</div>
				</div>
				<div className='flex justify-start gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
					<Button
						className='h-6 w-6 p-0'
						onClick={e => {
							e.stopPropagation()
							handleNavigate()
						}}
						variant='ghost'
					>
						<ExternalLink className='h-3 w-3' />
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='h-6 w-6 p-0'
								onClick={e => e.preventDefault()}
								variant='ghost'
							>
								<MoreHorizontal className='h-3 w-3' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='center' side='bottom' sideOffset={2}>
							<DropdownMenuItem
								onClick={e => {
									e.preventDefault()
									handleRemoveRelationship()
								}}
							>
								<GitPullRequestClosed className='mr-2 h-4 w-4' />
								Remove as Child
							</DropdownMenuItem>
							<DropdownMenuItem
								className='text-red-600 focus:text-red-600'
								onClick={e => {
									e.preventDefault()
									handleDeleteTopic()
								}}
								variant='destructive'
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	)
}
