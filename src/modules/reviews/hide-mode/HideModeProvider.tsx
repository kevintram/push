import { useHotkey } from '@tanstack/react-hotkeys'
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import { toast } from '~/components/ui/Toast'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { readStoredValue, writeStoredValue } from '~/utils/storage'

import {
	type HideMode,
	HideModeContext,
	type HideModeStore,
} from './HideModeContext'
import { toastHideModeOn } from './toastHideModeOn'

const STORAGE_KEY = 'hideMode'
const HIDE_MODES = ['on', 'off'] as const satisfies ReadonlyArray<HideMode>

type HideModeProviderProps = {
	children: ReactNode
}

export function HideModeProvider({ children }: HideModeProviderProps) {
	const [state, setState] = useState<HideMode>(() =>
		readStoredValue(STORAGE_KEY, HIDE_MODES, 'off', 'session'),
	)

	// Every change goes through this provider, so it closes the toast here
	// rather than each caller, and the toast never shows a stale mode.
	const toastIdRef = useRef<string | undefined>(undefined)
	const closeToast = useCallback(() => {
		if (toastIdRef.current === undefined) return
		toast.close(toastIdRef.current)
		toastIdRef.current = undefined
	}, [])

	const setHide = useCallback(
		(newValue: HideMode) => {
			closeToast()
			setState(newValue)
			writeStoredValue(STORAGE_KEY, newValue, 'session')
		},
		[closeToast],
	)

	const toggleHide = useCallback(() => {
		closeToast()
		setState(currValue => {
			const newValue = currValue === 'on' ? 'off' : 'on'
			writeStoredValue(STORAGE_KEY, newValue, 'session')
			return newValue
		})
	}, [closeToast])

	const autoEnable = useCallback(() => {
		setHide('on')
		toastIdRef.current = toastHideModeOn(toggleHide)
	}, [setHide, toggleHide])

	useHotkey(appHotkeys.toggleHideMode, toggleHide)

	const storeValue = useMemo<HideModeStore>(
		() => ({
			hideMode: state,
			setHideMode: setHide,
			toggleHideMode: toggleHide,
			autoEnableHideMode: autoEnable,
		}),
		[state, setHide, toggleHide, autoEnable],
	)

	return <HideModeContext value={storeValue}>{children}</HideModeContext>
}
