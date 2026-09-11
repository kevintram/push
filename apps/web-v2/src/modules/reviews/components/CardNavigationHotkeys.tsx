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

/**
 * Registers navigation only while its card surface is mounted. Navigation keys
 * keep their intrinsic behavior in editable fields and the card's tab list.
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
					if (!isTabNavigation(event)) onPrevious()
				},
				options: { enabled: canGoPrevious },
			},
			{
				hotkey: nextHotkey,
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
			...(target === undefined ? {} : { target }),
		},
	)

	return null
}
