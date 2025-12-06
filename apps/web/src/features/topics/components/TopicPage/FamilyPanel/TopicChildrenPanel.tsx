import { useQuery } from '@tanstack/react-query'
import { Baby } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { getTopicChildren } from '~/features/topics/api/getTopicChildren'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/models/review-topic.types'
import { TopicCard } from '../../TopicCard'
import { AddRelationshipDialog } from '../AddRelationshipDialog'
import { AddRelationshipDropdown } from './AddRelationshipDropdown'

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

	const { data: children = [] } = useQuery({
		queryKey: ['topics', selectedTopic?.id, 'children'],
		queryFn: () => getTopicChildren(selectedTopic!.id),
		enabled: selectedTopic?.id !== undefined
	})

	const deleteRelationship = useDeleteRelationship()

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
					<AddRelationshipDropdown
						onOpenSearchDialog={() => setShowCreateDialog(true)}
						onTopicOpen={(topicId: number) => {
							openTopicDialog(topicId)
						}}
						relationshipType='child'
						topicId={selectedTopic?.id}
						variant='card'
					/>
				)
			}

			const handleRemoveRelationship = () => {
				if (!selectedTopic) return
				deleteRelationship.mutate({
					parent: selectedTopic.id,
					child: item.child.id
				})
			}

			return (
				<TopicCard
					minHeight={MIN_HEIGHT}
					onRemoveRelationship={handleRemoveRelationship}
					onTopicClick={() => {
						openTopicDialog(item.child.id)
					}}
					reviews={item.child.reviews ?? []}
					topic={item.child}
				/>
			)
		},
		[deleteRelationship, openTopicDialog, selectedTopic]
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
				onTopicCreated={(topicId: number) => {
					openTopicDialog(topicId)
				}}
				open={showCreateDialog}
				relationshipType='child'
				topicId={selectedTopic?.id}
			/>
		</>
	)
}
