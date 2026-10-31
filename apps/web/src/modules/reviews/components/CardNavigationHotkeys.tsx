import type { AppHotkey } from '@tanstack/react-hotkeys'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'

type CardNavigationHotkeysProps = {
	canGoNext: boolean
	canGoPrevious: boolean
	nextHotkey: AppHotkey
	onNext: () => void
	onPrevious: () => void
	previousHotkey: AppHotkey
	target?: RefObject<HTMLElement | null>
}

/**
 * Registers navigation only while its card surface is mounted. Navigation keys
 * keep their intrinsic behavior in editable fields, and do nothing behind a
 * modal dialog.
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
				callback: onPrevious,
				options: { enabled: canGoPrevious },
			},
			{
				hotkey: nextHotkey,
				callback: onNext,
				options: { enabled: canGoNext },
			},
		],
		{ target },
	)

	return null
}
