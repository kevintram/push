import type { Hotkey } from '@tanstack/react-hotkeys'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'

type CardNavigationHotkeysProps = {
	canGoNext: boolean
	canGoPrevious: boolean
	nextHotkey: Hotkey
	onNext: () => void
	onPrevious: () => void
	previousHotkey: Hotkey
	target?: RefObject<HTMLElement | null>
}

function isTabNavigation(event: KeyboardEvent) {
	return (
		event.target instanceof Element &&
		event.target.closest('[role="tablist"]') !== null
	)
}

// Dialogs, popovers, and menus sit above the card, so moving the card behind
// them would strand or discard what they're showing.
const OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"]'

function isInsideOverlay(event: KeyboardEvent) {
	return (
		event.target instanceof Element &&
		event.target.closest(OVERLAY_SELECTOR) !== null
	)
}

/**
 * Registers navigation only while its card surface is mounted. Navigation keys
 * keep their intrinsic behavior in editable fields, the card's tab list, and
 * any overlay open above the card.
 */
export function CardNavigationHotkeys({
	canGoNext,
	canGoPrevious,
	nextHotkey,
	onNext,
	onPrevious,
	previousHotkey,
	target,
}: CardNavigationHotkeysProps) {
	useHotkeys(
		[
			{
				hotkey: previousHotkey,
				callback: event => {
					if (!isTabNavigation(event) && !isInsideOverlay(event))
						onPrevious()
				},
				options: { enabled: canGoPrevious },
			},
			{
				hotkey: nextHotkey,
				callback: event => {
					if (!isTabNavigation(event) && !isInsideOverlay(event))
						onNext()
				},
				options: { enabled: canGoNext },
			},
		],
		{
			preventDefault: false,
			requireReset: true,
			stopPropagation: false,
			...(target === undefined ? {} : { target }),
		},
	)

	return null
}
