import type {
	ReviewFilter,
	ReviewFocusOrder
} from '~/modules/review-cards/types/review-card.types'

export type ReviewFocusSearch = {
	card?: number
	done?: boolean
	filter: ReviewFilter
	include_future?: boolean
	order: ReviewFocusOrder
	shuffle?: string
}

export function makeShuffleSeed(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function buildFocusSearch({
	card,
	done,
	filter,
	include_future,
	order,
	shuffle
}: ReviewFocusSearch): ReviewFocusSearch {
	return {
		card,
		done: done === true ? true : undefined,
		filter,
		include_future: include_future === true ? true : undefined,
		order,
		shuffle: order === 'random' ? shuffle : undefined
	}
}
