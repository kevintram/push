import dayjs from 'dayjs'
import {
	ChevronDown,
	Link,
	Loader2,
	Plus,
	Search,
	SquarePen
} from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicReview } from '~/features/reviews/api/createTopicReview'
import { useCreateTopicOtherRelationship } from '../api/createTopicOtherRelationship'
import { useDeleteTopicOtherRelationship } from '../api/deleteTopicOtherRelationship'
import { useTopicsRelatedTo } from '../api/getTopicsRelatedTo'
import { RelationshipDirection, type Topic } from '../types/topic.types'
import { AddRelationshipDialog } from './AddRelationshipDialog'
import { TopicCard } from './TopicCard'

const MIN_WIDTH = 192
const MIN_HEIGHT = 96

type ListItem = { type: 'add-button' } | { type: 'related'; topic: Topic }

interface TopicRelatedPanelProps {
	topicId: number | undefined
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	isCollapsed?: boolean
	onToggleCollapse?: () => void
	/**
	 * Called when a related topic is selected/clicked.
	 * If not provided, defaults to opening the topic dialog.
	 */
	onRelatedSelect?: (topicId: number) => void
	/**
	 * Custom card renderer. If not provided, uses default TopicCard.
	 * @param topic - The related topic to render
	 * @param onRemove - Callback to remove the relationship
	 * @param onClick - Callback when the card is clicked
	 */
	renderCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function TopicRelatedPanel({
	topicId,
	getScrollElement,
	scrollMargin,
	isCollapsed = false,
	onToggleCollapse,
	onRelatedSelect,
	renderCard
}: TopicRelatedPanelProps) {
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const { openTopicDialog } = useReviewTopicDialog()

	const { data: related = [] } = useTopicsRelatedTo(topicId)

	const deleteRelationship = useDeleteTopicOtherRelationship()
	const createRelationship = useCreateTopicOtherRelationship()
	const createTopicReviewMutation = useCreateTopicReview()

	const isCreating = createRelationship.isPending

	// Determine navigation behavior
	const handleRelatedSelect = useCallback(
		(relatedTopicId: number) => {
			if (onRelatedSelect) {
				onRelatedSelect(relatedTopicId)
			} else {
				openTopicDialog(relatedTopicId)
			}
		},
		[onRelatedSelect, openTopicDialog]
	)

	const handleCreateNew = useCallback(
		async (query = '') => {
			if (!topicId) return

			try {
				const newTopicData = {
					name: '',
					notes: query.trim() || '',
					archived: false,
					inboxed: false
				}

				// Create topic and relationship
				const newTopicResponse = await createRelationship.mutateAsync({
					fromTopicId: topicId,
					data: { to_topic: newTopicData }
				})

				// Get the newly created related topic ID
				const newTopicId = newTopicResponse.to_topic.id

				// fire and forget 'Created' review creation
				createTopicReviewMutation
					.mutateAsync({
						topic_id: newTopicId,
						review: {
							description: 'Created',
							notes: '',
							scheduled_at: null,
							completed_at: dayjs().format('YYYY-MM-DD')
						},
						rating: 'good'
					})
					.catch(() => {
						// Ignore fire-and-forget errors (for now)
					})

				// Navigate to the created topic
				handleRelatedSelect(newTopicId)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[
			topicId,
			createRelationship,
			handleRelatedSelect,
			createTopicReviewMutation
		]
	)

	const handleTopicSelected = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			await createRelationship.mutateAsync({
				fromTopicId: topicId,
				data: { to_topic_id: topic.id }
			})
		},
		[topicId, createRelationship]
	)

	// Combine add button and related topics into a single array
	const items = useMemo<Array<ListItem>>(
		() => [
			{ type: 'add-button' },
			...related.map(topic => ({ type: 'related' as const, topic }))
		],
		[related]
	)

	const estimateItemSize = useCallback((item: ListItem) => {
		// Add button is always first
		if (item.type === 'add-button') return 60

		// Estimate height based on topic name and notes length
		const { topic } = item
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
	}, [])

	const renderItem = useCallback(
		(item: ListItem) => {
			if (item.type === 'add-button') {
				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true} disabled={isCreating}>
							<Card className='cursor-pointer border-2 border-dashed transition-colors hover:bg-muted/50'>
								<CardContent className='flex items-center justify-center p-3'>
									{isCreating ? (
										<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
									) : (
										<Plus className='h-4 w-4 text-muted-foreground' />
									)}
								</CardContent>
							</Card>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start' side='right'>
							<DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
								<Search className='h-4 w-4' />
								Search
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleCreateNew()}>
								<SquarePen className='h-4 w-4' />
								Create New
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)
			}

			const handleRemoveRelationship = () => {
				if (!topicId) return

				const { id: relatedTopicId, relationship_direction } = item.topic

				// Default to 'outgoing' logic if direction is missing or 'outgoing'
				// If relationship is 'outgoing', it means Current(from) -> Related(to)
				// If relationship is 'incoming', it means Related(from) -> Current(to)
				if (relationship_direction === RelationshipDirection.Incoming) {
					deleteRelationship.mutate({
						fromTopicId: relatedTopicId,
						toTopicId: topicId
					})
				} else {
					deleteRelationship.mutate({
						fromTopicId: topicId,
						toTopicId: relatedTopicId
					})
				}
			}

			const handleClick = () => {
				handleRelatedSelect(item.topic.id)
			}

			// Use custom renderer if provided
			if (renderCard) {
				return renderCard(item.topic, handleRemoveRelationship, handleClick)
			}

			// Default card rendering
			return (
				<TopicCard
					minHeight={MIN_HEIGHT}
					onRemoveRelationship={handleRemoveRelationship}
					onTopicClick={() => handleClick()}
					removeRelationshipText='Remove as related'
					topic={item.topic}
				/>
			)
		},
		[
			deleteRelationship,
			topicId,
			isCreating,
			handleCreateNew,
			handleRelatedSelect,
			renderCard
		]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		if (item.type === 'add-button') return 'add-button'
		return item.topic.id
	}, [])

	return (
		<>
			<div className='flex flex-col'>
				<div className='mb-3 flex items-center justify-between'>
					<Button
						className='flex items-center gap-2 p-0'
						onClick={onToggleCollapse}
						variant='ghost'
					>
						<Link className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-xs'>
							Other related ({related.length})
						</span>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
						/>
					</Button>
				</div>
				{!isCollapsed && (
					<div className='flex-1'>
						<MasonryLayout
							estimateItemSize={estimateItemSize}
							gap={16}
							getItemKey={getItemKey}
							getScrollElement={getScrollElement}
							items={items}
							minItemWidth={MIN_WIDTH}
							renderItem={renderItem}
							scrollMargin={scrollMargin}
						/>
					</div>
				)}
			</div>

			<AddRelationshipDialog
				isCreating={isCreating}
				onCreateNew={handleCreateNew}
				onOpenChange={setShowCreateDialog}
				onSelected={handleTopicSelected}
				open={showCreateDialog}
				relationshipType='related'
				topicId={topicId}
			/>
		</>
	)
}
