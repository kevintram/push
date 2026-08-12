import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'

export const reviewCardQueries = {
	listNew: () => convexQuery(api.reviewCards.listNew, {}),
	listByTopic: (topicId: Id<'topics'>) =>
		convexQuery(api.reviewCards.listByTopic, { topicId }),
	detail: (reviewCardId: Id<'reviewCards'>) =>
		convexQuery(api.reviewCards.get, { reviewCardId }),
}

export function useCreateReviewCard() {
	const mutationFn = useConvexMutation(api.reviewCards.create)
	return useMutation({ mutationFn })
}

export function useUpdateReviewCard() {
	const mutationFn = useConvexMutation(api.reviewCards.update)
	return useMutation({ mutationFn })
}

export function useDeleteReviewCard() {
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()

	const mutationFn = useConvexMutation(api.reviewCards.remove)

	return useMutation({
		mutationFn,
		onSuccess: ({ _id, topicId }) => {
			// if deleted card is currently open, fall back to its topic
			if (
				matchRoute({
					to: '/review-cards/$reviewCardId',
					params: { reviewCardId: _id },
					fuzzy: true,
				})
			) {
				void navigate({
					to: '/library/$topicId',
					params: { topicId },
				})
			}
		},
	})
}
