import { type QueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import {
	isTopicDetailReviewCardControlsVariant,
	isTopicDetailReviewCardFilter,
	type TopicDetailReviewCardControlsVariant,
	type TopicDetailReviewCardFilter,
} from '~/app/pages/topic-detail/shared'
import { TopicDetailPage } from '~/app/pages/topic-detail/TopicDetailPage'
import { reviewCardsQueryOptions } from '~/modules/review-cards/api/getReviewCards'
import { topicQueryOptions } from '~/modules/topics/api/getTopic'
import { topicsQueryOptions } from '~/modules/topics/api/getTopics'

interface TopicDetailRouteSearch {
	controls?: TopicDetailReviewCardControlsVariant
	filter?: TopicDetailReviewCardFilter
	focusTitle?: boolean
}

export function validateTopicDetailSearch(
	search: Record<string, unknown>,
): TopicDetailRouteSearch {
	const controls =
		typeof search.controls === 'string' ? search.controls : undefined
	const filter = typeof search.filter === 'string' ? search.filter : undefined

	return {
		controls:
			controls && isTopicDetailReviewCardControlsVariant(controls)
				? controls
				: undefined,
		filter:
			filter && isTopicDetailReviewCardFilter(filter)
				? filter
				: undefined,
		focusTitle:
			search.focusTitle === true ||
			search.focusTitle === 'true' ||
			undefined,
	}
}

export function prefetchTopicDetailRouteData({
	queryClient,
	topicId,
}: {
	queryClient: Pick<QueryClient, 'prefetchQuery'>
	topicId: number
}) {
	void queryClient
		.prefetchQuery(topicQueryOptions(topicId))
		.catch(() => undefined)
	void queryClient
		.prefetchQuery(
			topicsQueryOptions({
				sort: 'title',
				order: 'asc',
			}),
		)
		.catch(() => undefined)
	void queryClient
		.prefetchQuery(
			topicsQueryOptions({
				subtree_of: topicId,
				sort: 'title',
				order: 'asc',
			}),
		)
		.catch(() => undefined)
	void queryClient
		.prefetchQuery(
			reviewCardsQueryOptions({
				topic_id: topicId,
				include_descendants: true,
				order: 'desc',
			}),
		)
		.catch(() => undefined)
}

export const Route = createFileRoute('/topics_/$topicId')({
	validateSearch: validateTopicDetailSearch,
	loader: ({ context, params }) => {
		prefetchTopicDetailRouteData({
			queryClient: context.queryClient,
			topicId: Number(params.topicId),
		})
	},
	component: TopicDetailRoute,
})

function TopicDetailRoute() {
	const navigate = useNavigate()
	const { topicId } = Route.useParams()
	const search = Route.useSearch()

	return (
		<TopicDetailPage
			cardTypeFilter={search.filter}
			focusTitle={search.focusTitle}
			onCardTypeFilterChange={filter =>
				navigate({
					to: '/topics/$topicId',
					params: { topicId },
					search: {
						...(search.controls
							? { controls: search.controls }
							: {}),
						...(filter === 'all' ? {} : { filter }),
					},
					hash: true,
					resetScroll: false,
					replace: true,
				})
			}
			reviewCardControlsVariant={search.controls}
			topicId={Number(topicId)}
		/>
	)
}
