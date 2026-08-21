import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import { getErrorMessage } from '~/utils/error'

// `expandPath` decides whether `path` holds ancestor ids or the documents they
// name. It is a runtime argument, so `path` is typed as the union of both;
// callers that pass `expandPath: true` cast `path` to `Array<Topic>`. The two
// values are distinct Convex cache entries, so a caller wanting both shapes
// subscribes twice.
export const topicQueries = {
	list: () => convexQuery(api.topics.list, {}),
	search: (query: string) => convexQuery(api.topics.search, { query }),
	detail: (topicId: Id<'topics'>, { expandPath }: { expandPath: boolean }) =>
		convexQuery(api.topics.get, { expandPath, topicId }),
}

export function useCreateTopic() {
	const mutationFn = useConvexMutation(api.topics.create)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to create topic', {
				description: getErrorMessage(error),
			}),
	})
}

export function useUpdateTopic() {
	const mutationFn = useConvexMutation(api.topics.update)
	return useMutation({
		mutationFn,
		onError: error =>
			toast.error('Failed to update topic', {
				description: getErrorMessage(error),
			}),
	})
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
