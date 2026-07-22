import { useContext } from 'react'

import { HideModeContext, type HideModeStore } from './HideModeContext'

export function useHideMode() {
	const context = useContext<HideModeStore | null>(HideModeContext)

	if (!context) {
		throw new Error('useHideMode must be used inside HideModeProvider!')
	}

	return context
}
