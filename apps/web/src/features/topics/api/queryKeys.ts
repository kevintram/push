export const topicKeys = {
	all: ['topics'] as const,
	list: (params: Record<string, unknown> = {}) =>
		[...topicKeys.all, 'list', params] as const,
	detail: (topicId: number) => [...topicKeys.all, 'detail', topicId] as const
}
