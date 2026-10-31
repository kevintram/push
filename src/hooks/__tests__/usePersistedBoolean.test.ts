import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { usePersistedBoolean } from '../usePersistedBoolean'

describe('usePersistedBoolean', () => {
	afterEach(() => {
		window.localStorage.clear()
	})

	it('starts from the fallback when nothing is stored', () => {
		const { result } = renderHook(() => usePersistedBoolean('flag', true))

		expect(result.current[0]).toBe(true)
	})

	it('starts from the stored value', () => {
		window.localStorage.setItem('flag', 'false')

		const { result } = renderHook(() => usePersistedBoolean('flag', true))

		expect(result.current[0]).toBe(false)
	})

	it('stores updates', () => {
		const { result } = renderHook(() => usePersistedBoolean('flag', true))

		act(() => result.current[1](false))

		expect(result.current[0]).toBe(false)
		expect(window.localStorage.getItem('flag')).toBe('false')
	})
})
