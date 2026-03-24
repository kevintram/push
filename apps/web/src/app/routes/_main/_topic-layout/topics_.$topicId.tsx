import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	TopicDetailPage,
	type TopicDetailReviewCardFilter
} from '~/app/pages/topic-detail/TopicDetailPage'
import { reviewCardsQueryOptions } from '~/features/review-cards/api/getReviewCards'
import { topicQueryOptions } from '~/features/topics/api/getTopic'
import { topicsQueryOptions } from '~/features/topics/api/getTopics'

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

export const Route = createFileRoute('/_main/_topic-layout/topics_/$topicId')({
	validateSearch: validateTopicDetailSearch,
	loaderDeps: ({ search }) => ({
		filter: search.filter ?? 'all'
	}),
	loader: async ({ context, deps, params }) => {
		const topicId = Number(params.topicId)
		const selectedCardType = deps.filter === 'all' ? undefined : deps.filter

		await Promise.all([
			context.queryClient.prefetchQuery(topicQueryOptions(topicId)),
			context.queryClient.prefetchQuery(
				topicsQueryOptions({
					sort: 'title',
					order: 'asc'
				})
			),
			context.queryClient.prefetchQuery(
				reviewCardsQueryOptions({
					topic_id: topicId,
					type: selectedCardType,
					order: 'desc'
				})
			)
		])
	},
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
