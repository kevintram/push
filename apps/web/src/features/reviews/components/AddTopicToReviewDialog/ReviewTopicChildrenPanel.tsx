import { useQuery } from '@tanstack/react-query'
import { Baby, Loader2, Plus, Search, SquarePen } from 'lucide-react'
import { useCallback, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { getTopicChildren } from '~/features/topics/api/getTopicChildren'
import { AddRelationshipDialog } from '~/features/topics/components/TopicPage/AddRelationshipDialog'
import { useCreateRelationship } from '~/features/topics/hooks/useCreateRelationship'
import { useCreateTopic } from '~/features/topics/hooks/useCreateTopic'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import type { Topic } from '~/models/review-topic.types'
import { AddTopicCard } from './AddTopicCard'

const MIN_WIDTH = 192
const MIN_HEIGHT = 96

type ListItem = { type: 'add-button' } | { type: 'child'; child: Topic }

interface ReviewTopicChildrenPanelProps {
	topic?: Topic
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	onNestedTopicCreated: (topic: Topic) => Promise<void>
	onTopicSwitch: (topic: Topic) => void
}

export function ReviewTopicChildrenPanel({
	topic,
	getScrollElement,
	scrollMargin,
	onNestedTopicCreated,
	onTopicSwitch
}: ReviewTopicChildrenPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)

	const { data: children = [] } = useQuery({
		queryKey: ['topics', topic?.id, 'children'],
		queryFn: () => getTopicChildren(topic!.id),
		enabled: topic?.id !== undefined
	})

	const createTopic = useCreateTopic()
	const createRelationship = useCreateRelationship()
	const deleteRelationship = useDeleteRelationship()

	const isCreating = createTopic.isPending || createRelationship.isPending

	const handleCreateNew = useCallback(async () => {
		if (!topic) return

		try {
			// Create blank topic
			const newTopic = await createTopic.mutateAsync({
				name: '',
				notes: ''
			})

			// Create parent-child relationship
			await createRelationship.mutateAsync({
				parent: topic.id,
				child: newTopic.id
			})

			// Call the callback which will add to review and navigate
			await onNestedTopicCreated(newTopic)
		} catch (_error) {}
	}, [topic, createTopic, createRelationship, onNestedTopicCreated])

	const handleTopicCreatedFromSearch = useCallback(
		async (newTopic: Topic) => {
			if (!topic) return

			try {
				// Create parent-child relationship
				await createRelationship.mutateAsync({
					parent: topic.id,
					child: newTopic.id
				})
				await onNestedTopicCreated(newTopic)
			} catch (_error) {}
		},
		[topic, createRelationship, onNestedTopicCreated]
	)

	const handleExistingTopicSelected = useCallback(
		async (selectedTopic: Topic) => {
			if (!topic) return

			try {
				// Create parent-child relationship
				await createRelationship.mutateAsync({
					parent: topic.id,
					child: selectedTopic.id
				})
				await onNestedTopicCreated(selectedTopic)
			} catch (_error) {}
		},
		[topic, createRelationship, onNestedTopicCreated]
	)

	// Combine add button and children into a single array
	const items: Array<ListItem> = [
		{ type: 'add-button' },
		...children.map(child => ({ type: 'child' as const, child }))
	]

	const estimateItemSize = useCallback((item: ListItem) => {
		if (item.type === 'add-button') return 60

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
							<DropdownMenuItem onClick={() => setShowSearchDialog(true)}>
								<Search className='h-4 w-4' />
								Search
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleCreateNew}>
								<SquarePen className='h-4 w-4' />
								Create New
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)
			}

			const handleRemoveRelationship = () => {
				if (!topic) return
				deleteRelationship.mutate({
					parent: topic.id,
					child: item.child.id
				})
			}

			return (
				<AddTopicCard
					onCardClick={onTopicSwitch}
					onRemoveRelationship={handleRemoveRelationship}
					topic={item.child}
				/>
			)
		},
		[isCreating, handleCreateNew, topic, deleteRelationship, onTopicSwitch]
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
				onOpenChange={setShowSearchDialog}
				onRelationshipCreated={handleTopicCreatedFromSearch}
				onTopicOpen={handleExistingTopicSelected}
				open={showSearchDialog}
				relationshipType='child'
				topicId={topic?.id}
			/>
		</>
	)
}
