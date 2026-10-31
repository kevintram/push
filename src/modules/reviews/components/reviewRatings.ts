import { Check, CheckCheck, Circle, Construction, X } from 'lucide-react'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import type { DateString } from '~/types/date'
import { formatAbsoluteDate } from '~/utils/date'

import type { Rating } from '../types/review.types'

/** Each rating, in order, with the key that picks it. */
export const ratings = {
	miss: { label: 'Miss', Icon: X, hotkey: appHotkeys.rateMiss },
	hard: { label: 'Hard', Icon: Construction, hotkey: appHotkeys.rateHard },
	good: { label: 'Good', Icon: Check, hotkey: appHotkeys.rateGood },
	easy: { label: 'Easy', Icon: CheckCheck, hotkey: appHotkeys.rateEasy },
} as const

/** The choice for a review with no rating yet. */
export const todoRating = {
	label: 'Todo',
	Icon: Circle,
	hotkey: appHotkeys.rateTodo,
} as const

/** Radio values are strings, so Todo, a review without a rating, is ''. */
export const TODO_VALUE = ''

/** Every choice a rating control offers: the ratings, then Todo. */
export const ratingChoices = [
	...Object.entries(ratings).map(([value, rating]) => ({ value, ...rating })),
	{ value: TODO_VALUE, ...todoRating },
]

export function ratingFromChoice(value: string): Rating | null {
	return value === TODO_VALUE ? null : (value as Rating)
}

export function getRating(value: Rating | undefined) {
	return value === undefined ? null : ratings[value]
}

/** Icon and descriptive text for a card's most recent review. */
export function getLastReviewedDetails(
	lastReviewedAt: DateString,
	lastRating: Rating | null,
) {
	const rating = getRating(lastRating ?? undefined)
	const absoluteDate = formatAbsoluteDate(lastReviewedAt)

	return {
		Icon: rating?.Icon ?? null,
		ariaLabel: rating
			? `${rating.label}, reviewed ${absoluteDate}`
			: `Reviewed ${absoluteDate}`,
		tooltip: rating ? `${rating.label} on ${absoluteDate}` : absoluteDate,
	}
}
