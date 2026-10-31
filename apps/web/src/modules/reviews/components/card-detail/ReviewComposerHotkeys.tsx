import { useHotkeys } from '@tanstack/react-hotkeys'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

import { useReviewComposerState } from '../reviewComposerContext'

/**
 * The card's keys for its review composer, which open it if needed: `C`
 * focuses its ratings, where `0`–`4` pick one, and `S` opens its date picker.
 */
export function ReviewComposerHotkeys() {
	const { isPending, openComposer } = useReviewComposerState()

	useHotkeys(
		[
			{
				hotkey: appHotkeys.newReview,
				callback: () => openComposer('rating'),
			},
			{
				hotkey: appHotkeys.openDatePicker,
				callback: () => openComposer('date'),
			},
		],
		{ enabled: !isPending },
	)

	return null
}
