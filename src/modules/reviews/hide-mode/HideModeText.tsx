import type { ReactNode } from 'react'

import { useHideMode } from './useHideMode'

type HideModeTextProps = {
	on: ReactNode
	off: ReactNode
}

/**
 * Shows `on` or `off` to match hide mode, so text rendered once, such as a
 * toast's, stays current as the mode toggles.
 */
export function HideModeText({ on, off }: HideModeTextProps) {
	const { hideMode } = useHideMode()
	return hideMode === 'on' ? on : off
}
