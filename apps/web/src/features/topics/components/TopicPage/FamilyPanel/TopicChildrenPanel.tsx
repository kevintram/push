import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Baby, Loader2, Plus, Search, SquarePen } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createTopicReview as createTopicReviewApi } from '~/features/topic_reviews/api'
import { getTopicChildren } from '~/features/topics/api/getTopicChildren'
import { AddRelationshipDialog } from '~/features/topics/components/AddRelationshipDialog'
import { useCreateRelationship } from '~/features/topics/hooks/useCreateRelationship'
import { useDeleteRelationship } from '~/features/topics/hooks/useDeleteRelationship'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/models/review-topic.types'
import { TopicCard } from '../../TopicCard'

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
	const createRelationship = useCreateRelationship()
	const queryClient = useQueryClient()
	const { mutateAsync: createTopicReview } = useMutation({
		mutationFn: createTopicReviewApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['topics', 'reviews'] })
		}
	})

	const isCreating = createRelationship.isPending

	const handleCreateNew = useCallback(
		async (query = '') => {
			if (!selectedTopic) return

			try {
				const newTopicData = {
					name: '',
					notes: query.trim() || '',
					archived: false,
					inboxed: false
				}

				// Use inline creation - create topic and relationship in one call
				const response = await createRelationship.mutateAsync({
					parent: selectedTopic.id,
					childData: newTopicData
				})

				// Get the newly created child topic ID
				const newTopicId = response.child.id

				// fire and forget 'Created' review creation
				createTopicReview({
					topic_id: newTopicId,
					review: {
						description: 'Created',
						notes: '',
						scheduled_at: null,
						completed_at: dayjs().format('YYYY-MM-DD')
					},
					rating: 'good'
				}).catch(() => {
					// Ignore fire-and-forget errors (for now)
				})

				// Open the created topic
				openTopicDialog(newTopicId)
			} catch (_error) {}
		},
		[selectedTopic, createRelationship, openTopicDialog, createTopicReview]
	)

	const handleTopicSelected = useCallback(
		async (topic: Topic) => {
			if (!selectedTopic) return

			try {
				await createRelationship.mutateAsync({
					parent: selectedTopic.id,
					child: topic.id
				})

				// Open the selected topic dialog
				openTopicDialog(topic.id)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[selectedTopic, createRelationship, openTopicDialog]
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
		[
			deleteRelationship,
			openTopicDialog,
			selectedTopic,
			isCreating,
			handleCreateNew
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
				topicId={selectedTopic?.id}
			/>
		</>
	)
}
