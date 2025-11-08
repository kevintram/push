import { Plus } from 'lucide-react'
import { use, useCallback } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Rating, Topic } from '~/models/todo-topic.types'
import { TodoContext } from '../../stores/SelectedTodoContext'

const MIN_WIDTH = 210
const MIN_HEIGHT = 96

type ListItem = { type: 'topic'; topic: Topic; rating?: Rating }

interface TodoTopicsPanelProps {
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	onAddTopic: () => void
	onRemoveTopicFromTodo: (todoId: number, topicId: number) => void
}

export function TodoTopicsPanel({
	getScrollElement,
	scrollMargin,
	onAddTopic,
	onRemoveTopicFromTodo
}: TodoTopicsPanelProps) {
	const { todo } = use(TodoContext)
	const { openTopicDialog } = useTodoTopicDialog()

	// Extract topics from reviews if available, otherwise fallback to topics
	const topics = todo?.reviews?.map(review => review.topic) ?? todo?.topics ?? []

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	const items: Array<ListItem> = todo?.reviews
		? todo.reviews.map(review => ({
				type: 'topic' as const,
				topic: review.topic,
				rating: review.rating
			}))
		: (todo?.topics ?? []).map(topic => ({
				type: 'topic' as const,
				topic
			}))

	const estimateItemSize = useCallback((item: ListItem) => {
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
			return (
				<TopicCard
					minHeight={MIN_HEIGHT}
					onRemoveRelationship={() =>
						onRemoveTopicFromTodo(todo!.id, item.topic.id)
					}
					onTopicClick={handleTopicClick}
					rating={item.rating}
					removeRelationshipText='Remove from todo'
					todos={item.topic.todos ?? []}
					topic={item.topic}
				/>
			)
		},
		[handleTopicClick, onRemoveTopicFromTodo, todo]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		return item.topic.id
	}, [])

	return (
		<div className='flex flex-col'>
			<div className='mb-3 flex items-center gap-2'>
				<span className='font-medium text-muted-foreground text-xs'>
					Topics ({topics.length})
				</span>
				<div className='flex-1' />
				<Button onClick={onAddTopic} size='icon-sm' variant='ghost'>
					<Plus />
				</Button>
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
	)
}
