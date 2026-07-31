import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'

export const topicQueries = {
	list: () => convexQuery(api.topics.list, {}),
	detail: (topicId: Id<'topics'>) => convexQuery(api.topics.get, { topicId }),
}

export function useCreateTopic() {
	const mutationFn = useConvexMutation(api.topics.create)
	return useMutation({ mutationFn })
}
