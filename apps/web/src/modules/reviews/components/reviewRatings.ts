import { Check, CheckCheck, Construction, X } from 'lucide-react'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import type { DateString } from '~/types/date'
import { formatAbsoluteDate } from '~/utils/date'

import type { Rating } from '../types/review.types'

/** Each rating, in order, with the key that picks it in the rating menu. */
export const ratings = {
	miss: { label: 'Miss', Icon: X, hotkey: appHotkeys.rateMiss },
	hard: { label: 'Hard', Icon: Construction, hotkey: appHotkeys.rateHard },
	good: { label: 'Good', Icon: Check, hotkey: appHotkeys.rateGood },
	easy: { label: 'Easy', Icon: CheckCheck, hotkey: appHotkeys.rateEasy },
} as const

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
