import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { convexQuery } from '@convex-dev/react-query'

export const topicQueries = {
	list: () => convexQuery(api.topics.list, {}),
	detail: (topicId: Id<'topics'>) => convexQuery(api.topics.get, { topicId }),
}
