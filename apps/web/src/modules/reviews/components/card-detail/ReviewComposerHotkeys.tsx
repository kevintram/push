import { useHotkeys } from '@tanstack/react-hotkeys'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

import { useReviewComposerState } from '../reviewComposerContext'

/**
 * The card's keys for its review composer, which open it if needed: `C`
 * focuses its rating picker, and `W` opens the rating menu, where `0`–`4`
 * pick a rating.
 */
export function ReviewComposerHotkeys() {
	const { isPending, openComposer } = useReviewComposerState()

	useHotkeys(
		[
			{
				hotkey: appHotkeys.newReview,
				callback: () => openComposer('focus'),
			},
			{
				hotkey: appHotkeys.openRatingMenu,
				callback: () => openComposer('menu'),
			},
		],
		{ enabled: !isPending },
	)

	return null
}
