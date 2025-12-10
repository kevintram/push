import type { GetTopicsParams, SearchTopicsParams } from '../types/api.types'

export const topicKeys = {
	all: ['topics'] as const,
	lists: () => [...topicKeys.all, 'list'] as const,
	list: (params: GetTopicsParams = {}) => {
		// Add params to key
		const key: Array<string | number> = [...topicKeys.lists()]
		for (const [paramKey, value] of Object.entries(params)) {
			if (value !== undefined) {
				key.push(paramKey, typeof value === 'string' ? value : String(value))
			}
		}
		return key
	},
	byId: (topicId: number) => [...topicKeys.all, topicId] as const,
	detail: (topicId: number) => [...topicKeys.byId(topicId), 'detail'] as const,
	children: (topicId: number) =>
		[...topicKeys.byId(topicId), 'children'] as const,
	parents: (topicId: number) =>
		[...topicKeys.byId(topicId), 'parents'] as const,
	related: (topicId: number) =>
		[...topicKeys.byId(topicId), 'related'] as const,
	search: (params: SearchTopicsParams = {}) => {
		// Add params to key
		const key: Array<string | number> = [...topicKeys.all, 'search']
		for (const [paramKey, value] of Object.entries(params)) {
			if (value !== undefined) {
				key.push(paramKey, typeof value === 'string' ? value : String(value))
			}
		}
		return key
	}
}
