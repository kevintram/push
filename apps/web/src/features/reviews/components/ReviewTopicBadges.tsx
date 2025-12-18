import { TopicBadge } from '~/features/topics/components/TopicBadge'
import type { ReviewSession } from '../types/review.types'

interface ReviewTopicBadgesProps {
	review: ReviewSession
}

export function ReviewTopicBadges({ review }: ReviewTopicBadgesProps) {
	// Extract topics and ratings from reviews if available, otherwise fallback to topics
	const items = review.reviews
		? review.reviews.map(tr => ({
				topic: tr.topic,
				rating: tr.rating
			}))
		: []

	const topicCount = items.length

	return (
		<div className='flex flex-wrap items-center gap-2'>
			<span className='font-medium text-muted-foreground text-xs'>
				Topics{topicCount > 0 && ` (${topicCount})`}
			</span>
			{items.map(({ topic, rating }) => (
				<TopicBadge
					key={topic.id}
					name={topic.name}
					notes={topic.notes}
					rating={rating}
				/>
			))}
		</div>
	)
}
