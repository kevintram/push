import { Baby, Plus } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Card, CardContent } from '~/components/ui/Card'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateRelationship } from '~/features/topics/hooks/useCreateRelationship'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import { useTopicChildren } from '~/features/topics/hooks/useTopicChildren'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/models/review-topic.types'
import { TopicCard } from '../../TopicCard'
import { AddRelationshipDialog } from '../AddRelationshipDialog'

const MIN_WIDTH = 192
const MIN_HEIGHT = 96

type ListItem = { type: 'add-button' } | { type: 'child'; child: Topic }

interface TopicChildrenPanelProps {
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
}

export function TopicChildrenPanel({
	getScrollElement,
	scrollMargin
}: TopicChildrenPanelProps = {}) {
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const { topic: selectedTopic } = use(TopicContext)
	const { openTopicDialog } = useReviewTopicDialog()

	const { data: children = [] } = useTopicChildren(selectedTopic?.id)

	const createRelationship = useCreateRelationship()

	const handleAddChild = useCallback(() => {
		setShowCreateDialog(true)
	}, [])

	const handleTopicCreated = useCallback(
		async (topic: Topic) => {
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
			openTopicDialog(child.id)
		},
		[openTopicDialog]
	)

	// Combine add button and children into a single array
	const items: Array<ListItem> = [
		{ type: 'add-button' },
		...children.map(child => ({ type: 'child' as const, child }))
	]

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
					<Card
						className='cursor-pointer border-2 border-dashed transition-colors hover:bg-muted/50'
						onClick={handleAddChild}
					>
						<CardContent className='flex items-center justify-center p-3'>
							<Plus className='h-4 w-4 text-muted-foreground' />
						</CardContent>
					</Card>
				)
			}

			return <ChildCard child={item.child} onChildClick={handleChildClick} />
		},
		[handleAddChild, handleChildClick]
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
		(_topic: Topic) => {
			onChildClick?.(child)
		},
		[onChildClick, child]
	)

	return (
		<TopicCard
			minHeight={MIN_HEIGHT}
			onRemoveRelationship={handleRemoveRelationship}
			onTopicClick={handleClick}
			reviews={child.reviews ?? []}
			topic={child}
		/>
	)
}
