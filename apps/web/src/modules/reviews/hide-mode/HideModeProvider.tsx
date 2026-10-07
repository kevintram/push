import { useHotkey } from '@tanstack/react-hotkeys'
import { type ReactNode, useCallback, useMemo, useState } from 'react'

import { readStoredValue, writeStoredValue } from '~/utils/storage'

import {
	type HideMode,
	HideModeContext,
	type HideModeStore,
} from './HideModeContext'
import { HIDE_MODE_HOTKEY } from './hideModeHotkey'

const STORAGE_KEY = 'hideMode'
const HIDE_MODES = ['on', 'off'] as const satisfies ReadonlyArray<HideMode>

type HideModeProviderProps = {
	children: ReactNode
}

export function HideModeProvider({ children }: HideModeProviderProps) {
	const [state, setState] = useState<HideMode>(() =>
		readStoredValue(STORAGE_KEY, HIDE_MODES, 'off', 'session'),
	)

	const setHide = useCallback((newValue: HideMode) => {
		setState(newValue)
		writeStoredValue(STORAGE_KEY, newValue, 'session')
	}, [])

	const toggleHide = useCallback(() => {
		setState(currValue => {
			const newValue = currValue === 'on' ? 'off' : 'on'
			writeStoredValue(STORAGE_KEY, newValue, 'session')
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
