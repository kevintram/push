import type { Id } from '@convex/_generated/dataModel'
import type { Topic } from '@convex/validators/topics'
import { useSuspenseQuery } from '@tanstack/react-query'

import { topicQueries } from '~/modules/library/api/topicQueries'
import { TopicPathBreadcrumbs } from '~/modules/library/components/TopicPathBreadcrumbs'

type ReviewCardBreadcrumbsProps = {
	primaryText: string
	topicId: Id<'topics'>
	onNavigate?: () => void
}

export function ReviewCardBreadcrumbs({
	primaryText,
	topicId,
	onNavigate,
}: ReviewCardBreadcrumbsProps) {
	const { data: topic } = useSuspenseQuery(
		topicQueries.detail(topicId, { expandPath: true }),
	)
	return (
		<TopicPathBreadcrumbs
			topics={[...(topic.path as Array<Topic>), topic as Topic]}
			currentLabel={primaryText}
			onNavigate={onNavigate}
		/>
	)
}
