export const topicKeys = {
	all: ['topics'] as const,
	today: () => [...topicKeys.all, 'today'] as const,
	soon: () => [...topicKeys.all, 'soon'] as const,
	unscheduled: () => [...topicKeys.all, 'unscheduled'] as const,
	inbox: () => [...topicKeys.all, 'inbox'] as const,
	future: () => [...topicKeys.all, 'future'] as const,
	root: () => [...topicKeys.all, 'root'] as const,
	archived: () => [...topicKeys.all, 'archived'] as const,
	recent: () => [...topicKeys.all, 'recent'] as const,
	detail: (topicId: number) => [...topicKeys.all, topicId] as const,
	children: (topicId: number) => [...topicKeys.detail(topicId), 'children'] as const,
	parents: (topicId: number) => [...topicKeys.detail(topicId), 'parents'] as const,
	search: (query: string, reviewId?: number) => {
		const base = [...topicKeys.all, 'search', query || 'recent'] as const
		return reviewId !== undefined ? [...base, reviewId] as const : base
	},
	potentialChildren: (topicId: number, searchQuery: string) =>
		['potential-children', topicId, searchQuery] as const,
	potentialParents: (topicId: number, searchQuery: string) =>
		['potential-parents', topicId, searchQuery] as const,
}

