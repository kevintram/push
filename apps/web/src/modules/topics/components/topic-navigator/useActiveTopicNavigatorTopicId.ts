import { useMatchRoute } from '@tanstack/react-router'

import { useReviewCard } from '~/modules/review-cards/api/getReviewCard'

function parsePositiveInteger(value: string | undefined) {
	if (value == null) return null

	const parsedValue = Number.parseInt(value, 10)
	return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null
}

export function useActiveTopicNavigatorTopicId() {
	const matchRoute = useMatchRoute()
	const topicMatch = matchRoute({ to: '/topics/$topicId' })
	const reviewCardMatch = matchRoute({ to: '/review-cards/$reviewCardId' })
	const topicId = parsePositiveInteger(
		topicMatch ? topicMatch.topicId : undefined,
	)
	const reviewCardId = parsePositiveInteger(
		reviewCardMatch ? reviewCardMatch.reviewCardId : undefined,
	)
	const { data: reviewCard } = useReviewCard(reviewCardId)

	if (topicId != null) return topicId
	if (reviewCardId != null) return reviewCard?.topicId ?? null

	return null
}
