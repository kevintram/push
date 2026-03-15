import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	TopicDetailPage,
	type TopicDetailReviewCardFilter
} from '~/app/pages/TopicDetailPage'

type TopicDetailRouteSearch = {
	filter?: TopicDetailReviewCardFilter
}

function isTopicDetailFilter(
	value: unknown
): value is TopicDetailReviewCardFilter {
	return value === 'all' || value === 'practice' || value === 'flashcard'
}

export function validateTopicDetailSearch(
	search: Record<string, unknown>
): TopicDetailRouteSearch {
	return isTopicDetailFilter(search.filter) ? { filter: search.filter } : {}
}

export const Route = createFileRoute('/_main/topics_/$topicId')({
	validateSearch: validateTopicDetailSearch,
	component: TopicDetailRoute
})

function TopicDetailRoute() {
	const navigate = useNavigate()
	const { topicId } = Route.useParams()
	const search = Route.useSearch()

	return (
		<TopicDetailPage
			cardTypeFilter={search.filter}
			onCardTypeFilterChange={filter =>
				navigate({
					to: '/topics/$topicId',
					params: { topicId },
					search: filter === 'all' ? {} : { filter }
				})
			}
			topicId={Number(topicId)}
		/>
	)
}
