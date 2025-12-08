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
	detail: (topicId: number) => [...topicKeys.all, topicId] as const,
	children: (topicId: number) =>
		[...topicKeys.detail(topicId), 'children'] as const,
	parents: (topicId: number) =>
		[...topicKeys.detail(topicId), 'parents'] as const,
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
