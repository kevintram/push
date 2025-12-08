export const reviewKeys = {
	all: ['reviews'] as const,
	today: () => [...reviewKeys.all, 'today'] as const,
	soon: () => [...reviewKeys.all, 'soon'] as const,
	unscheduled: () => [...reviewKeys.all, 'unscheduled'] as const,
	future: () => [...reviewKeys.all, 'future'] as const,
	logbook: () => [...reviewKeys.all, 'logbook'] as const,
	byTopic: (topicId: number) => [...reviewKeys.all, topicId] as const,
	detail: (reviewId: number) => [...reviewKeys.all, reviewId] as const,
}

