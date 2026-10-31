import { useHotkeys } from '@tanstack/react-hotkeys'
import { useNavigate } from '@tanstack/react-router'

import { REVIEW_LINKS } from '~/modules/reviews/reviewLinks'

/**
 * `G`, then a queue's key, goes to that review queue from anywhere. A key
 * that finishes a sequence belongs to it, so `G` then `F` never also flags
 * the open card.
 */
export function ReviewNavigationHotkeys() {
	const navigate = useNavigate()

	useHotkeys(
		REVIEW_LINKS.map(({ hotkey, to }) => ({
			hotkey,
			callback: () => void navigate({ to }),
		})),
	)

	return null
}
