import type {
	GetReviewCardsParams,
	ReviewCardQueueParams
} from '../types/review-card.types'

export const reviewCardKeys = {
	all: ['review-cards'] as const,
	list: (params: GetReviewCardsParams = {}) =>
		[...reviewCardKeys.all, 'list', params] as const,
	detail: (reviewCardId: number) =>
		[...reviewCardKeys.all, 'detail', reviewCardId] as const,
	queue: (params: ReviewCardQueueParams) =>
		[...reviewCardKeys.all, 'queue', params] as const
}
