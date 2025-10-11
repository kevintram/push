import { TopicCard } from '~/components/TopicCard'
import type { Topic } from '~/types/topics.types'

interface InboxItemProps {
	onSelect: (topic: Topic) => void
	topic: Topic
}

export function InboxItem({ topic, onSelect }: InboxItemProps) {
	return <TopicCard onTopicClick={onSelect} topic={topic} />
}
