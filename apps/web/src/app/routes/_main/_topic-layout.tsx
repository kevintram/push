import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useReviewCard } from '~/features/review-cards/api/getReviewCard'
import { TopicNavigatorRail } from '~/features/topics/components/TopicNavigator'

const TOPIC_DETAIL_PATH_PATTERN = /^\/topics\/([^/]+)$/
const REVIEW_CARD_DETAIL_PATH_PATTERN = /^\/review-cards\/([^/]+)$/

type TopicNavigatorRouteState =
	| {
			type: 'topics-index'
	  }
	| {
			type: 'topic-detail'
			topicId: number
	  }
	| {
			type: 'review-card-detail'
			reviewCardId: number
	  }
	| {
			type: 'other'
	  }

function parsePositiveInteger(value: string | undefined) {
	if (value == null) return null

	const parsedValue = Number.parseInt(value, 10)
	return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function getTopicNavigatorRouteState(
	pathname: string
): TopicNavigatorRouteState {
	if (pathname === '/topics') {
		return { type: 'topics-index' }
	}

	const topicMatch = TOPIC_DETAIL_PATH_PATTERN.exec(pathname)
	if (topicMatch != null) {
		const topicId = parsePositiveInteger(topicMatch[1])
		if (topicId != null) {
			return {
				type: 'topic-detail',
				topicId
			}
		}
	}

	const reviewCardMatch = REVIEW_CARD_DETAIL_PATH_PATTERN.exec(pathname)
	if (reviewCardMatch != null) {
		const reviewCardId = parsePositiveInteger(reviewCardMatch[1])
		if (reviewCardId != null) {
			return {
				type: 'review-card-detail',
				reviewCardId
			}
		}
	}

	return { type: 'other' }
}

function TopicLayout() {
	const pathname = useRouterState({
		select: state => state.location.pathname
	})
	const routeState = getTopicNavigatorRouteState(pathname)
	const reviewCardId =
		routeState.type === 'review-card-detail' ? routeState.reviewCardId : null
	const { data: reviewCard } = useReviewCard(reviewCardId)

	let activeTopicId: number | null = null
	if (routeState.type === 'topic-detail') {
		activeTopicId = routeState.topicId
	} else if (routeState.type === 'review-card-detail') {
		activeTopicId = reviewCard?.topic_id ?? null
	}

	return (
		<div className='flex h-full min-h-0 w-full'>
			<TopicNavigatorRail activeTopicId={activeTopicId} />
			<Outlet />
		</div>
	)
}

export const Route = createFileRoute('/_main/_topic-layout')({
	component: TopicLayout
})
