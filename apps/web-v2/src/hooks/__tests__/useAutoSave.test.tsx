import { act, renderHook } from '@testing-library/react'
import type { ChangeEvent } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAutoSave } from '../useAutoSave'

function changeEvent(
	value: string,
): ChangeEvent<HTMLInputElement | HTMLTextAreaElement> {
	return { target: { value } } as ChangeEvent<
		HTMLInputElement | HTMLTextAreaElement
	>
}

describe('useAutoSave', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	it('debounces saves while updating the local value immediately', () => {
		const onSave = vi.fn()
		const { result } = renderHook(() =>
			useAutoSave({
				initialValue: '',
				onSave,
				debounceMs: 1000,
				key: 'topic-1',
			}),
		)

		act(() => result.current.onChange(changeEvent('draft')))

		expect(result.current.value).toBe('draft')
		expect(onSave).not.toHaveBeenCalled()

		act(() => vi.advanceTimersByTime(1000))

		expect(onSave).toHaveBeenCalledOnce()
		expect(onSave).toHaveBeenCalledWith('draft')
	})

	it('flushes the pending save before switching keys', () => {
		const onSave = vi.fn()
		const { rerender, result } = renderHook(
			({ initialValue, key }: { initialValue: string; key: string }) =>
				useAutoSave({
					initialValue,
					onSave,
					debounceMs: 1000,
					key,
				}),
			{
				initialProps: { initialValue: 'one', key: 'topic-1' },
			},
		)

		act(() => result.current.onChange(changeEvent('one edited')))
		act(() => rerender({ initialValue: 'two', key: 'topic-2' }))

		expect(onSave).toHaveBeenCalledWith('one edited')
		expect(result.current.value).toBe('two')
	})

	it('flushes the pending save when unmounting', () => {
		const onSave = vi.fn()
		const { result, unmount } = renderHook(() =>
			useAutoSave({
				initialValue: '',
				onSave,
				debounceMs: 1000,
				key: 'topic-1',
			}),
		)

		act(() => result.current.onChange(changeEvent('draft')))
		act(unmount)

		expect(onSave).toHaveBeenCalledWith('draft')
	})

	it('accepts external values when there is no recent local edit', () => {
		const onSave = vi.fn()
		const { rerender, result } = renderHook(
			({ initialValue }: { initialValue: string }) =>
				useAutoSave({ initialValue, onSave, key: 'topic-1' }),
			{ initialProps: { initialValue: 'stale' } },
		)

		act(() => rerender({ initialValue: 'fresh' }))

		expect(result.current.value).toBe('fresh')
		expect(onSave).not.toHaveBeenCalled()
	})

	it('supports direct value updates and explicit flushes', () => {
		const onSave = vi.fn()
		const { result } = renderHook(() =>
			useAutoSave({
				initialValue: '',
				onSave,
				debounceMs: 1000,
				key: 'topic-1',
			}),
		)

		act(() => result.current.setValue('draft'))
		act(() => result.current.flush())

		expect(result.current.value).toBe('draft')
		expect(onSave).toHaveBeenCalledWith('draft')
	})
})
