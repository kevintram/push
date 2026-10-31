import { useHotkeys } from '@tanstack/react-hotkeys'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

import type { Rating } from '../../types/review.types'
import { useReviewComposerState } from '../reviewComposerContext'
import { ratings } from '../reviewRatings'

/**
 * The card's keys for its review composer. `C` opens the composer on the
 * rating picker, which is a button, so `0`–`4` work right after it. Each
 * rating key sets that rating (`0` clears it, leaving the review
 * uncompleted), opening the composer if needed, then moves on to the
 * description. None of them submit.
 */
export function ReviewComposerHotkeys() {
	const { isPending, openComposer, setRating } = useReviewComposerState()

	function rate(rating: Rating | null) {
		setRating(rating)
		openComposer('description')
	}

	useHotkeys(
		[
			{
				hotkey: appHotkeys.newReview,
				callback: () => openComposer('rating'),
			},
			{
				hotkey: appHotkeys.rateUncompleted,
				callback: () => rate(null),
			},
			...Object.entries(ratings).map(([rating, { hotkey }]) => ({
				hotkey,
				callback: () => rate(rating as Rating),
			})),
		],
		{ enabled: !isPending },
	)

	return null
}
