import { use } from 'react'
import { LearnableReviewsSidebar } from '~/components/LearnableReviewsSidebar'
import { TopicContext } from '../../stores/SelectedTopicContext'

interface ReviewsSidebarProps {
	readonly?: boolean
}

export function ReviewsSidebar({ readonly = false }: ReviewsSidebarProps) {
	const { topic } = use(TopicContext)

	return (
		<LearnableReviewsSidebar
			entity={topic}
			entityType='topic'
			readonly={readonly}
			sidebarClassName='[&_[data-slot=sidebar-inner]]:bg-background'
		/>
	)
}
