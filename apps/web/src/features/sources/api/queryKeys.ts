import type { GetSourcesParams } from '../types/api.types'

type SearchSourcesKeyParams = {
	query?: string
	limit?: number
	addableAsParentTo?: number
	addableAsChildTo?: number
}

export const sourceKeys = {
	all: ['sources'] as const,
	lists: () => [...sourceKeys.all, 'list'] as const,
	list: (params: GetSourcesParams = {}) => {
		// Add params to key
		const key: Array<string | number> = [...sourceKeys.lists()]
		for (const [paramKey, value] of Object.entries(params)) {
			if (value !== undefined) {
				key.push(paramKey, typeof value === 'string' ? value : String(value))
			}
		}
		return key
	},
	searches: () => [...sourceKeys.all, 'search'] as const,
	search: (params: SearchSourcesKeyParams = {}) => {
		const key: Array<string | number> = [...sourceKeys.searches()]
		for (const [paramKey, value] of Object.entries(params)) {
			if (value !== undefined) {
				key.push(paramKey, typeof value === 'string' ? value : String(value))
			}
		}
		return key
	},
	byId: (sourceId: number) => [...sourceKeys.all, sourceId] as const,
	detail: (sourceId: number) =>
		[...sourceKeys.byId(sourceId), 'detail'] as const,
	children: (sourceId: number) =>
		[...sourceKeys.byId(sourceId), 'children'] as const,
	topics: (sourceId: number) =>
		[...sourceKeys.byId(sourceId), 'topics'] as const,
	prerequisites: (sourceId: number) =>
		[...sourceKeys.byId(sourceId), 'prerequisites'] as const,
	practices: (sourceId: number) =>
		[...sourceKeys.byId(sourceId), 'practices'] as const
}
