import { useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'

import {
	FOCUS_OVERLAY_NEXT_HOTKEY,
	FOCUS_OVERLAY_PREVIOUS_HOTKEY,
} from './focusOverlayHotkey'

type FocusOverlayNavigationHotkeysProps = {
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
 * Registers navigation only while the dialog portal is mounted. Arrow keys
 * keep their intrinsic behavior in editable fields and the card's tab list.
 */
export function FocusOverlayNavigationHotkeys({
	canGoNext,
	canGoPrevious,
	onNext,
	onPrevious,
	target,
}: FocusOverlayNavigationHotkeysProps) {
	useHotkeys(
		[
			{
				hotkey: FOCUS_OVERLAY_PREVIOUS_HOTKEY,
				callback: event => {
					if (!isTabNavigation(event)) onPrevious()
				},
				options: { enabled: canGoPrevious },
			},
			{
				hotkey: FOCUS_OVERLAY_NEXT_HOTKEY,
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
