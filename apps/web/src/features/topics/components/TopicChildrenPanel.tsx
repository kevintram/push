import dayjs from 'dayjs'
import { Baby, Loader2, Plus, Search, SquarePen } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicReview } from '~/features/reviews/api/createTopicReview'
import type { Topic } from '~/models/review-topic.types'
import { useCreateRelationship } from '../api/createTopicRelationship'
import { useDeleteRelationship } from '../api/deleteTopicRelationship'
import { useTopicChildren } from '../api/getTopicChildren'
import { AddRelationshipDialog } from './AddRelationshipDialog'
import { TopicCard } from './TopicCard'

const MIN_WIDTH = 192
const MIN_HEIGHT = 96

type ListItem = { type: 'add-button' } | { type: 'child'; child: Topic }

interface TopicChildrenPanelProps {
	topicId: number | undefined
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
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
	onChildSelect,
	renderCard
}: TopicChildrenPanelProps) {
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const { openTopicDialog } = useReviewTopicDialog()

	const { data: children = [] } = useTopicChildren(topicId)

	const deleteRelationship = useDeleteRelationship()
	const createRelationship = useCreateRelationship()
	const createTopicReviewMutation = useCreateTopicReview()

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

				// Use inline creation - create topic and relationship in one call
				const response = await createRelationship.mutateAsync({
					parent: topicId,
					childData: newTopicData
				})

				// Get the newly created child topic ID
				const newTopicId = response.child.id

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
				handleChildSelect(newTopicId)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[topicId, createRelationship, handleChildSelect, createTopicReviewMutation]
	)

	const handleTopicSelected = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			try {
				await createRelationship.mutateAsync({
					parent: topicId,
					child: topic.id
				})

				// Navigate to the selected topic
				handleChildSelect(topic.id)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[topicId, createRelationship, handleChildSelect]
	)

	// Combine add button and children into a single array
	const items = useMemo<Array<ListItem>>(
		() => [
			{ type: 'add-button' },
			...children.map(child => ({ type: 'child' as const, child }))
		],
		[children]
	)

	const estimateItemSize = useCallback((item: ListItem) => {
		// Add button is always first
		if (item.type === 'add-button') return 60

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
					minHeight={MIN_HEIGHT}
					onRemoveRelationship={handleRemoveRelationship}
					onTopicClick={() => handleClick()}
					reviews={item.child.reviews ?? []}
					topic={item.child}
				/>
			)
		},
		[
			deleteRelationship,
			topicId,
			isCreating,
			handleCreateNew,
			handleChildSelect,
			renderCard
		]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		if (item.type === 'add-button') return 'add-button'
		return item.child.id
	}, [])

	return (
		<>
			<div className='flex flex-col'>
				<div className='mb-3 flex items-center gap-2'>
					<Baby className='h-4 w-4' />
					<span className='font-medium text-muted-foreground text-xs'>
						Children ({children.length})
					</span>
				</div>
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
			</div>

			<AddRelationshipDialog
				isCreating={isCreating}
				onCreateNew={handleCreateNew}
				onOpenChange={setShowCreateDialog}
				onSelected={handleTopicSelected}
				open={showCreateDialog}
				relationshipType='child'
				topicId={topicId}
			/>
		</>
	)
}
