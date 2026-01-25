import type { GetPracticesParams, SearchPracticesParams } from '../types'

export const practiceKeys = {
	all: ['practices'] as const,
	lists: () => [...practiceKeys.all, 'list'] as const,
	list: (params: GetPracticesParams = {}) => {
		const key: Array<string | number> = [...practiceKeys.lists()]
		for (const [paramKey, value] of Object.entries(params)) {
			if (value !== undefined) {
				key.push(paramKey, typeof value === 'string' ? value : String(value))
			}
		}
		return key
	},
	search: (params: SearchPracticesParams = {}) => {
		const key: Array<string | number> = [...practiceKeys.all, 'search']
		if (params.query !== undefined) {
			key.push('query', params.query)
		}
		if (params.limit !== undefined) {
			key.push('limit', params.limit)
		}
		return key
	},
	byId: (practiceId: number) => [...practiceKeys.all, practiceId] as const,
	detail: (practiceId: number) =>
		[...practiceKeys.byId(practiceId), 'detail'] as const,
	topics: (practiceId: number) =>
		[...practiceKeys.byId(practiceId), 'topics'] as const,
	sources: (practiceId: number) =>
		[...practiceKeys.byId(practiceId), 'sources'] as const
}
