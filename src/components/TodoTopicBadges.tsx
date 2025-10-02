import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '~/components/ui/Badge'
import { AddTopicToTodoDialog } from '~/features/topic-hub/components/Topic/TimelineSidebar/AddTopicToTodoDialog'
import type { Tables } from '~/types/database.types'
import { TodoTopicBadge } from './TodoTopicBadge'

interface TodoTopicBadgesProps {
	topics: Array<Tables<'topics'>>
	todoId: number | undefined
	onRemoveTopicFromTodo: (todoId: number, topicId: number) => Promise<void>
}

export function TodoTopicBadges({
	topics,
	todoId,
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
				{topics.map(topic => (
					<TodoTopicBadge
						key={topic.id}
						onRemove={onRemoveTopicFromTodo}
						todoId={todoId ?? 0}
						topic={topic}
					/>
				))}
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
				todoId={todoId}
			/>
		</>
	)
}
