import { useQueryClient } from '@tanstack/react-query'
import {
	ChevronDown,
	Link,
	Loader2,
	Plus,
	Search,
	SquarePen
} from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicOtherRelationship } from '../api/createTopicOtherRelationship'
import { useDeleteTopicOtherRelationship } from '../api/deleteTopicOtherRelationship'
import { useTopicsRelatedTo } from '../api/getTopicsRelatedTo'
import { topicKeys } from '../api/queryKeys'
import { RelationshipDirection, type Topic } from '../types/topic.types'
import { AddRelationshipDialog } from './AddRelationshipDialog'
import { AddTopicDialog } from './AddTopicDialog'
import { TopicActionMenu } from './TopicActionMenu'
import { TopicCard } from './TopicCard'

const MIN_WIDTH = 192
const MIN_HEIGHT = 96

type ListItem = { type: 'related'; topic: Topic }

interface TopicRelatedPanelProps {
	topicId: number | undefined
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
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
	onRelatedSelect,
	renderCard
}: TopicRelatedPanelProps) {
	const queryClient = useQueryClient()
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [showAddTopicDialog, setShowAddTopicDialog] = useState(false)
	const [isCollapsed, setIsCollapsed] = useState(false)
	const { openTopicDialog } = useReviewTopicDialog()

	const { data: related = [], isLoading } = useTopicsRelatedTo(topicId)

	const deleteRelationship = useDeleteTopicOtherRelationship()
	const createRelationship = useCreateTopicOtherRelationship()

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

	const handleAdd = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			await createRelationship.mutateAsync({
				fromTopicId: topicId,
				data: { to_topic_id: topic.id }
			})
		},
		[topicId, createRelationship]
	)

	const handleTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(
				topicKeys.related(topicId!),
				(old: Array<Topic>) => {
					return old.map(topic => {
						if (topic.id === updatedTopic.id) {
							return updatedTopic
						}
						return topic
					})
				}
			)
		},
		[queryClient, topicId]
	)

	// Map related topics into array
	const items = useMemo<Array<ListItem>>(
		() => related.map(topic => ({ type: 'related' as const, topic })),
		[related]
	)

	const estimateItemSize = useCallback((item: ListItem) => {
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
					headerRight={
						<TopicActionMenu
							onRemoveRelationship={handleRemoveRelationship}
							onTopicUpdateSuccess={handleTopicUpdateSuccess}
							removeRelationshipText='Remove as related'
							topic={item.topic}
						/>
					}
					minHeight={MIN_HEIGHT}
					onTopicClick={() => handleClick()}
					topic={item.topic}
				/>
			)
		},
		[
			deleteRelationship,
			topicId,
			handleRelatedSelect,
			renderCard,
			handleTopicUpdateSuccess
		]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		return item.topic.id
	}, [])

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				actions={
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true} disabled={isCreating}>
							<Button className='gap-1' size='sm' variant='secondary'>
								{isCreating ? (
									<Loader2 className='h-4 w-4 animate-spin' />
								) : (
									<Plus className='h-4 w-4' />
								)}
								Add
								<ChevronDown className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start'>
							<DropdownMenuItem onClick={() => setShowAddTopicDialog(true)}>
								<SquarePen className='h-4 w-4' />
								Create New
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
								<Search className='h-4 w-4' />
								Search
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				}
				label={
					<Button
						className='flex items-center gap-2 p-0'
						onClick={() => setIsCollapsed(!isCollapsed)}
						variant='ghost'
					>
						<Link className='h-4 w-4' />
						<span className='font-medium text-md text-muted-foreground'>
							Other related topics ({related.length})
						</span>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
						/>
					</Button>
				}
			/>
			{!isCollapsed && (
				<div className='flex-1 py-6'>
					{isLoading ? (
						<MasonryLayoutSkeleton
							count={6}
							gap={16}
							minItemWidth={MIN_WIDTH}
						/>
					) : (
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
					)}
				</div>
			)}

			<AddRelationshipDialog
				isCreating={isCreating}
				onCreateNew={() => {
					setShowCreateDialog(false)
					setShowAddTopicDialog(true)
				}}
				onOpenChange={setShowCreateDialog}
				onSelected={handleAdd}
				open={showCreateDialog}
				relationshipType='related'
				topicId={topicId}
			/>

			{topicId && (
				<AddTopicDialog
					context={{
						type: 'related',
						fromTopicId: topicId
					}}
					onOpenChange={setShowAddTopicDialog}
					onSuccess={newTopicId => {
						toast('Topic created', {
							action: {
								label: 'Open',
								onClick: () => handleRelatedSelect(newTopicId)
							}
						})
					}}
					open={showAddTopicDialog}
				/>
			)}
		</div>
	)
}
