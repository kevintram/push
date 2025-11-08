import type { Todo } from '~/features/todos/api'
import { TopicBadge } from '~/features/topics/components/TopicBadge'

interface TodoTopicBadgesProps {
	todo: Todo
}

export function TodoTopicBadges({ todo }: TodoTopicBadgesProps) {
	const topicCount = todo.topics?.length ?? 0

	return (
		<div className='flex flex-wrap items-center gap-2'>
			<span className='font-medium text-muted-foreground text-xs'>
				Topics{topicCount > 0 && ` (${topicCount})`}
			</span>
			{todo.topics?.map(
				(topic: { id: number; name: string; notes: string }) => (
					<TopicBadge
						key={topic.id}
						maxWidth={12}
						name={topic.name}
						notes={topic.notes}
					/>
				)
			)}
		</div>
	)
}
