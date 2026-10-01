import { useHotkey } from '@tanstack/react-hotkeys'
import { type ReactNode, useCallback, useMemo, useState } from 'react'

import {
	type HideMode,
	HideModeContext,
	type HideModeStore,
} from './HideModeContext'
import { HIDE_MODE_HOTKEY } from './hideModeHotkey'

const STORAGE_KEY = 'hideMode'

type HideModeProviderProps = {
	children: ReactNode
}

export function HideModeProvider({ children }: HideModeProviderProps) {
	const [state, setState] = useState<HideMode>(() =>
		sessionStorage.getItem(STORAGE_KEY) === 'on' ? 'on' : 'off',
	)

	const setHide = useCallback((newValue: HideMode) => {
		setState(newValue)
		sessionStorage.setItem(STORAGE_KEY, newValue)
	}, [])

	const toggleHide = useCallback(() => {
		setState(currValue => {
			const newValue = currValue === 'on' ? 'off' : 'on'
			sessionStorage.setItem(STORAGE_KEY, newValue)
			return newValue
		})
	}, [])

	useHotkey(HIDE_MODE_HOTKEY, () => {
		toggleHide()
	})

	const storeValue = useMemo<HideModeStore>(
		() => ({
			hideMode: state,
			setHideMode: setHide,
			toggleHideMode: toggleHide,
		}),
		[state, setHide, toggleHide],
	)

	return <HideModeContext value={storeValue}>{children}</HideModeContext>
}
