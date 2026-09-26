import { createContext } from 'react'

export type HideMode = 'on' | 'off'

export type HideModeStore = {
	hideMode: HideMode
	setHideMode: (newValue: HideMode) => void
	toggleHideMode: () => void
}

export const HideModeContext = createContext<HideModeStore | null>(null)
