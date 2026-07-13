import { act, renderHook } from '@testing-library/react'
import type { ChangeEvent } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAutoSave } from '../useAutoSave'

const change = (value: string) =>
	({ target: { value } }) as ChangeEvent<HTMLTextAreaElement>

describe('useAutoSave', () => {
	beforeEach(() => vi.useFakeTimers())
	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	it('saves after the default one-second pause', () => {
		const onSave = vi.fn()
		const { result } = renderHook(() =>
			useAutoSave({ initialValue: '', onSave }),
		)
		act(() => result.current.onChange(change('draft')))
		act(() => vi.advanceTimersByTime(999))
		expect(onSave).not.toHaveBeenCalled()
		act(() => vi.advanceTimersByTime(1))
		expect(onSave).toHaveBeenCalledWith('draft')
	})

	it('flushes the old value and resets when its key changes', () => {
		const onSave = vi.fn()
		const { result, rerender } = renderHook(
			({ initialValue, key }) =>
				useAutoSave({ initialValue, onSave, key }),
			{ initialProps: { initialValue: 'one', key: 'topic-1' } },
		)
		act(() => result.current.onChange(change('edited one')))
		act(() => rerender({ initialValue: 'two', key: 'topic-2' }))
		expect(onSave).toHaveBeenCalledWith('edited one')
		expect(result.current.value).toBe('two')
	})

	it('flushes pending work on unmount', () => {
		const onSave = vi.fn()
		const { result, unmount } = renderHook(() =>
			useAutoSave({ initialValue: '', onSave }),
		)
		act(() => result.current.setValue('leaving'))
		act(unmount)
		expect(onSave).toHaveBeenCalledWith('leaving')
	})

	it('accepts external values when there was no recent edit', () => {
		const { result, rerender } = renderHook(
			({ initialValue }) =>
				useAutoSave({ initialValue, onSave: vi.fn(), key: 'same' }),
			{ initialProps: { initialValue: 'old' } },
		)
		act(() => rerender({ initialValue: 'fresh' }))
		expect(result.current.value).toBe('fresh')
	})

	it('does not overwrite recent typing with an external refresh', () => {
		const { result, rerender } = renderHook(
			({ initialValue }) =>
				useAutoSave({ initialValue, onSave: vi.fn(), key: 'same' }),
			{ initialProps: { initialValue: 'old' } },
		)
		act(() => result.current.onChange(change('local edit')))
		act(() => rerender({ initialValue: 'server refresh' }))
		expect(result.current.value).toBe('local edit')
	})

	it('supports explicit flush', () => {
		const onSave = vi.fn()
		const { result } = renderHook(() =>
			useAutoSave({ initialValue: '', onSave }),
		)
		act(() => result.current.setValue('now'))
		act(result.current.flush)
		expect(onSave).toHaveBeenCalledWith('now')
	})
})
