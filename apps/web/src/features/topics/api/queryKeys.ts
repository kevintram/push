import type { GetTopicsParams } from '../types/api.types'

export const topicKeys = {
	all: ['topics'] as const,
	lists: () => [...topicKeys.all, 'list'] as const,
	list: (params: GetTopicsParams = {}) => {
		const key: Array<string | number> = [...topicKeys.lists()]
		// Add params to key for proper cache invalidation
		for (const [paramKey, value] of Object.entries(params)) {
			if (value !== undefined) {
				key.push(paramKey, typeof value === 'string' ? value : String(value))
			}
		}
		return key
	},
	detail: (topicId: number) => [...topicKeys.all, topicId] as const,
	children: (topicId: number) =>
		[...topicKeys.detail(topicId), 'children'] as const,
	parents: (topicId: number) =>
		[...topicKeys.detail(topicId), 'parents'] as const,
	search: (query: string, reviewId?: number) => {
		const base = [...topicKeys.all, 'search', query || 'recent'] as const
		return reviewId !== undefined ? ([...base, reviewId] as const) : base
	},
	potentialChildren: (topicId: number, searchQuery: string) =>
		['potential-children', topicId, searchQuery] as const,
	potentialParents: (topicId: number, searchQuery: string) =>
		['potential-parents', topicId, searchQuery] as const
}
