import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'

export const topicQueries = {
	list: () => convexQuery(api.topics.list, {}),
	detail: (topicId: Id<'topics'>) => convexQuery(api.topics.get, { topicId }),
}

export function useCreateTopic() {
	const mutationFn = useConvexMutation(api.topics.create)
	return useMutation({ mutationFn })
}

export function useDeleteTopic() {
	const navigate = useNavigate()
	const matchRoute = useMatchRoute()

	const mutationFn = useConvexMutation(api.topics.remove)

	return useMutation({
		mutationFn,
		onSuccess: ({ _id, parentId }) => {
			// if deleted topic is currently open
			if (
				matchRoute({
					to: '/library/$topicId',
					params: { topicId: _id },
				})
			) {
				// navigate to parent if has one, library otherwise
				void navigate(
					parentId !== undefined
						? {
								to: '/library/$topicId',
								params: { topicId: parentId },
							}
						: { to: '/library' },
				)
			}
		},
	})
}
