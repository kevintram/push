export const mutationScopes = {
	topics: { id: 'topics' },
	reviewCards: { id: 'review-cards' },
	reviews: { id: 'reviews' },
} as const

export const optimisticMutationKeys = {
	all: ['optimistic'] as const,
	topics: ['optimistic', 'topics'] as const,
	reviewCards: ['optimistic', 'review-cards'] as const,
	reviews: ['optimistic', 'reviews'] as const,
} as const
