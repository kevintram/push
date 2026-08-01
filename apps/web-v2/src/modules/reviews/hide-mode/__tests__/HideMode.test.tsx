import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { HideModeProvider } from '../HideModeProvider'
import { useHideMode } from '../useHideMode'

function HideModeWrapper({ children }: { children: ReactNode }) {
	return <HideModeProvider>{children}</HideModeProvider>
}

describe('HideMode', () => {
	beforeEach(() => {
		sessionStorage.clear()
	})

	it('defaults to off when no value is stored', () => {
		const { result } = renderHook(useHideMode, {
			wrapper: HideModeWrapper,
		})

		expect(result.current.hideMode).toBe('off')
	})

	it.each([
		['off', 'off'],
		['on', 'on'],
	] as const)('parses a stored value of %s', (storedValue, expectedValue) => {
		sessionStorage.setItem('hideMode', storedValue)

		const { result } = renderHook(useHideMode, {
			wrapper: HideModeWrapper,
		})

		expect(result.current.hideMode).toBe(expectedValue)
	})

	it('updates the value and session storage', () => {
		const { result } = renderHook(useHideMode, {
			wrapper: HideModeWrapper,
		})

		act(() => {
			result.current.setHideMode('on')
		})

		expect(result.current.hideMode).toBe('on')
		expect(sessionStorage.getItem('hideMode')).toBe('on')
	})

	it('throws when used outside the provider', () => {
		expect(() => renderHook(useHideMode)).toThrow(
			'useHideMode must be used inside HideModeProvider!',
		)
	})
})
