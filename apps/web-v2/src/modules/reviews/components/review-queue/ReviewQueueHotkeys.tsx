import { useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'

import {
	REVIEW_QUEUE_NEXT_HOTKEY,
	REVIEW_QUEUE_PREVIOUS_HOTKEY,
} from './reviewQueueKeybindings'

type ReviewQueueHotkeysProps = {
	canGoNext: boolean
	canGoPrevious: boolean
	onNext: () => void
	onPrevious: () => void
	target: RefObject<HTMLElement | null>
}

function isTabNavigation(event: KeyboardEvent) {
	return (
		event.target instanceof Element &&
		event.target.closest('[role="tablist"]') !== null
	)
}

/**
 * Registers navigation only while its review surface is mounted. Arrow keys
 * keep their intrinsic behavior in editable fields and the card's tab list.
 */
export function ReviewQueueHotkeys({
	canGoNext,
	canGoPrevious,
	onNext,
	onPrevious,
	target,
}: ReviewQueueHotkeysProps) {
	useHotkeys(
		[
			{
				hotkey: REVIEW_QUEUE_PREVIOUS_HOTKEY,
				callback: event => {
					if (!isTabNavigation(event)) onPrevious()
				},
				options: { enabled: canGoPrevious },
			},
			{
				hotkey: REVIEW_QUEUE_NEXT_HOTKEY,
				callback: event => {
					if (!isTabNavigation(event)) onNext()
				},
				options: { enabled: canGoNext },
			},
		],
		{
			preventDefault: false,
			requireReset: true,
			stopPropagation: false,
			target,
		},
	)

	return null
}
