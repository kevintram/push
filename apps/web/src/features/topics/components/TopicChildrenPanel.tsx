import { useQueryClient } from '@tanstack/react-query'
import {
	Baby,
	ChevronDown,
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
import { useCreateRelationship } from '../api/createTopicRelationship'
import { useDeleteRelationship } from '../api/deleteTopicRelationship'
import { useTopicChildren } from '../api/getTopicChildren'
import { topicKeys } from '../api/queryKeys'
import type { Topic } from '../types/topic.types'
import { AddRelationshipDialog } from './AddRelationshipDialog'
import { AddTopicDialog, type SrsSource } from './AddTopicDialog'
import { TopicActionMenu } from './TopicActionMenu'
import { TopicCard } from './TopicCard'

const MIN_WIDTH = 280
const MIN_HEIGHT = 96

type ListItem = { type: 'child'; child: Topic }

interface TopicChildrenPanelProps {
	topicId: number | undefined
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Parent topic's SRS fields for the "inherit SRS" option.
	 */
	srsSource?: SrsSource | null
	/**
	 * Called when a child is selected/clicked.
	 * If not provided, defaults to opening the topic dialog.
	 */
	onChildSelect?: (topicId: number) => void
	/**
	 * Custom card renderer. If not provided, uses default TopicCard.
	 * @param topic - The child topic to render
	 * @param onRemove - Callback to remove the relationship
	 * @param onClick - Callback when the card is clicked
	 */
	renderCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function TopicChildrenPanel({
	topicId,
	getScrollElement,
	scrollMargin,
	srsSource,
	onChildSelect,
	renderCard
}: TopicChildrenPanelProps) {
	const queryClient = useQueryClient()
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [showAddTopicDialog, setShowAddTopicDialog] = useState(false)
	const [isCollapsed, setIsCollapsed] = useState(false)
	const { openTopicDialog } = useReviewTopicDialog()

	const { data: children = [], isLoading } = useTopicChildren(topicId)

	const deleteRelationship = useDeleteRelationship()
	const createRelationship = useCreateRelationship()

	const isCreating = createRelationship.isPending

	// Determine navigation behavior
	const handleChildSelect = useCallback(
		(childTopicId: number) => {
			if (onChildSelect) {
				onChildSelect(childTopicId)
			} else {
				openTopicDialog(childTopicId)
			}
		},
		[onChildSelect, openTopicDialog]
	)

	const handleAddTopic = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			await createRelationship.mutateAsync({
				parent: topicId,
				child: topic.id
			})
		},
		[topicId, createRelationship]
	)

	const handleTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(
				topicKeys.children(topicId!),
				(old: Array<Topic>) => {
					return old.map(child => {
						if (child.id === updatedTopic.id) {
							return updatedTopic
						}
						return child
					})
				}
			)
		},
		[queryClient, topicId]
	)

	// Map children into array
	const items = useMemo<Array<ListItem>>(
		() => children.map(child => ({ type: 'child' as const, child })),
		[children]
	)

	const estimateItemSize = useCallback((item: ListItem) => {
		// Estimate height based on topic name and notes length
		const { child } = item
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
	}, [])

	const renderItem = useCallback(
		(item: ListItem) => {
			const handleRemoveRelationship = () => {
				if (!topicId) return
				deleteRelationship.mutate({
					parent: topicId,
					child: item.child.id
				})
			}

			const handleClick = () => {
				handleChildSelect(item.child.id)
			}

			// Use custom renderer if provided
			if (renderCard) {
				return renderCard(item.child, handleRemoveRelationship, handleClick)
			}

			// Default card rendering
			return (
				<TopicCard
					headerRight={
						<TopicActionMenu
							onRemoveRelationship={handleRemoveRelationship}
							onTopicUpdateSuccess={handleTopicUpdateSuccess}
							removeRelationshipText='Remove as Child'
							topic={item.child}
						/>
					}
					minHeight={MIN_HEIGHT}
					onTopicClick={() => handleClick()}
					topic={item.child}
				/>
			)
		},
		[
			deleteRelationship,
			topicId,
			handleChildSelect,
			renderCard,
			handleTopicUpdateSuccess
		]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		return item.child.id
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
						<Baby className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-sm'>
							Child topics ({children.length})
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
				onSelected={handleAddTopic}
				open={showCreateDialog}
				relationshipType='child'
				topicId={topicId}
			/>

			{topicId && (
				<AddTopicDialog
					context={{
						type: 'child',
						parentTopicId: topicId,
						srsSource
					}}
					onOpenChange={setShowAddTopicDialog}
					onSuccess={newTopicId => {
						toast('Topic created', {
							action: {
								label: 'Open',
								onClick: () => handleChildSelect(newTopicId)
							}
						})
					}}
					open={showAddTopicDialog}
				/>
			)}
		</div>
	)
}
