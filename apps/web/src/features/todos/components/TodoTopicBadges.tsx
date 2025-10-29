import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import type { Todo } from '~/features/todos/api'
import { AddTopicToTodoDialog } from '~/features/todos/components/AddTopicToTodoDialog'
import { TopicBadge } from '~/features/topics/components/TopicBadge'

interface TodoTopicBadgesProps {
	todo: Todo
	onRemoveTopicFromTodo: (todoId: number, topicId: number) => Promise<void>
}

export function TodoTopicBadges({
	todo,
	onRemoveTopicFromTodo
}: TodoTopicBadgesProps) {
	const [showAddDialog, setShowAddDialog] = useState(false)

	const handleAddTopic = () => {
		setShowAddDialog(true)
	}

	return (
		<>
			<div className='flex flex-wrap items-center gap-2'>
				<span className='font-medium text-muted-foreground text-xs'>
					Topics
				</span>
				{todo.topics.map(
					(topic: { id: number; name: string; notes: string }) => (
						<TopicBadge
							key={topic.id}
							name={topic.name}
							notes={topic.notes}
							onRemove={() => onRemoveTopicFromTodo(todo.id, topic.id)}
							topicId={topic.id}
						/>
					)
				)}
				<Badge
					className='cursor-pointer items-center border-dashed py-1 hover:bg-muted/50'
					onClick={handleAddTopic}
					variant='outline'
				>
					<Plus className='h-3 w-3' />
				</Badge>
			</div>

			<AddTopicToTodoDialog
				onOpenChange={setShowAddDialog}
				open={showAddDialog}
				todo={todo}
			/>
		</>
	)
}
