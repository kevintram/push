import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	TopicDetailPage,
	type TopicDetailReviewCardFilter,
	type TopicDetailTab
} from '~/app/pages/TopicDetailPage'

type TopicDetailRouteSearch = {
	tab: TopicDetailTab
	filter?: TopicDetailReviewCardFilter
}

function isTopicDetailTab(value: unknown): value is TopicDetailTab {
	return value === 'subtopics' || value === 'review_cards'
}

function isTopicDetailFilter(
	value: unknown
): value is TopicDetailReviewCardFilter {
	return value === 'all' || value === 'practice' || value === 'flashcard'
}

export function validateTopicDetailSearch(
	search: Record<string, unknown>
): TopicDetailRouteSearch {
	const tab = isTopicDetailTab(search.tab) ? search.tab : 'subtopics'

	if (tab === 'subtopics') {
		return { tab }
	}

	return {
		tab,
		filter: isTopicDetailFilter(search.filter) ? search.filter : 'all'
	}
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
			activeHomeTab={search.tab}
			cardTypeFilter={search.filter}
			onActiveHomeTabChange={tab =>
				navigate({
					to: '/topics/$topicId',
					params: { topicId },
					search: tab === 'subtopics' ? { tab } : { tab, filter: 'all' }
				})
			}
			onCardTypeFilterChange={filter =>
				navigate({
					to: '/topics/$topicId',
					params: { topicId },
					search: { tab: 'review_cards', filter }
				})
			}
			topicId={Number(topicId)}
		/>
	)
}
