import type { Hotkey } from '@tanstack/react-hotkeys'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'

import { isInsideOverlay } from '~/utils/keyboard'

type CardNavigationHotkeysProps = {
	canGoNext: boolean
	canGoPrevious: boolean
	nextHotkey: Hotkey
	onNext: () => void
	onPrevious: () => void
	previousHotkey: Hotkey
	target?: RefObject<HTMLElement | null>
}

/**
 * Registers navigation only while its card surface is mounted. Navigation keys
 * keep their intrinsic behavior in editable fields and in any overlay open
 * above the card.
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
				// Dialogs, popovers, and menus sit above the card, so moving the
				// card behind them would strand or discard what they're showing.
				callback: event => {
					if (!isInsideOverlay(event)) onPrevious()
				},
				options: { enabled: canGoPrevious },
			},
			{
				hotkey: nextHotkey,
				callback: event => {
					if (!isInsideOverlay(event)) onNext()
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
