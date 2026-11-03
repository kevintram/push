import { createContext } from 'react'

export type HideMode = 'on' | 'off'

export type HideModeStore = {
	hideMode: HideMode
	setHideMode: (newValue: HideMode) => void
	toggleHideMode: () => void
	/**
	 * Turns hide mode on without the user asking, and shows a toast that says
	 * so. Any later change to hide mode closes the toast.
	 */
	autoEnableHideMode: () => void
}

export const HideModeContext = createContext<HideModeStore | null>(null)
