import { TopicCard } from '~/components/TopicCard'
import type { Tables } from '~/types/database.types'

interface InboxItemProps {
	onSelect: (topic: Tables<'topics'>) => void
	topic: Tables<'topics'>
}

export function InboxItem({ topic, onSelect }: InboxItemProps) {
	return <TopicCard onTopicClick={onSelect} topic={topic} />
}
