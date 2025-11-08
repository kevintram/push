import type { Todo } from '~/features/todos/api'
import { TopicBadge } from '~/features/topics/components/TopicBadge'

interface TodoTopicBadgesProps {
	todo: Todo
}

export function TodoTopicBadges({ todo }: TodoTopicBadgesProps) {
	// Extract topics and ratings from reviews if available, otherwise fallback to topics
	const items = todo.reviews
		? todo.reviews.map(review => ({
				topic: review.topic,
				rating: review.rating
			}))
		: (todo.topics ?? []).map(topic => ({ topic, rating: null }))

	const topicCount = items.length

	return (
		<div className='flex flex-wrap items-center gap-2'>
			<span className='font-medium text-muted-foreground text-xs'>
				Topics{topicCount > 0 && ` (${topicCount})`}
			</span>
			{items.map(({ topic, rating }) => (
				<TopicBadge
					key={topic.id}
					maxWidth={12}
					name={topic.name}
					notes={topic.notes}
					rating={rating}
				/>
			))}
		</div>
	)
}
