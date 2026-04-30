import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/features/review-cards/types/review-card.types'

export type ReviewFocusSearch = {
	filter: ReviewFilter
	order: ReviewFocusOrder
	shuffle?: string
}

export function makeShuffleSeed(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function buildFocusSearch({
	filter,
	order,
	shuffle
}: ReviewFocusSearch): ReviewFocusSearch {
	return {
		filter,
		order,
		shuffle: order === 'random' ? shuffle : undefined
	}
}
