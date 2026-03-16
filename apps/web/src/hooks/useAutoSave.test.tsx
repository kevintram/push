import { act, renderHook } from '@testing-library/react'
import type { ChangeEvent } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutoSave } from './useAutoSave'

function createChangeEvent(
	value: string
): ChangeEvent<HTMLInputElement | HTMLTextAreaElement> {
	return {
		target: { value }
	} as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
}

describe('useAutoSave', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	it('flushes pending saves when the key changes', () => {
		const onSave = vi.fn()
		const { rerender, result } = renderHook(
			({ initialValue, key }: { initialValue: string; key: string }) =>
				useAutoSave({
					initialValue,
					onSave,
					debounceMs: 1000,
					key
				}),
			{
				initialProps: {
					initialValue: 'topic one',
					key: 'topic-1'
				}
			}
		)

		act(() => {
			result.current.onChange(createChangeEvent('topic one edited'))
		})

		expect(onSave).not.toHaveBeenCalled()

		act(() => {
			rerender({
				initialValue: 'topic two',
				key: 'topic-2'
			})
		})

		expect(onSave).toHaveBeenCalledTimes(1)
		expect(onSave).toHaveBeenCalledWith('topic one edited')
		expect(result.current.value).toBe('topic two')
	})

	it('flushes pending saves when unmounting', () => {
		const onSave = vi.fn()
		const { result, unmount } = renderHook(() =>
			useAutoSave({
				initialValue: '',
				onSave,
				debounceMs: 1000,
				key: 'topic-1'
			})
		)

		act(() => {
			result.current.onChange(createChangeEvent('draft before navigation'))
		})

		expect(onSave).not.toHaveBeenCalled()

		act(() => {
			unmount()
		})

		expect(onSave).toHaveBeenCalledTimes(1)
		expect(onSave).toHaveBeenCalledWith('draft before navigation')
	})

	it('applies external initialValue updates when user has not typed', () => {
		const onSave = vi.fn()
		const { rerender, result } = renderHook(
			({ initialValue }: { initialValue: string }) =>
				useAutoSave({
					initialValue,
					onSave,
					debounceMs: 1000,
					key: 'topic-1'
				}),
			{
				initialProps: {
					initialValue: 'stale cache value'
				}
			}
		)

		act(() => {
			rerender({
				initialValue: 'fresh server value'
			})
		})

		expect(result.current.value).toBe('fresh server value')
		expect(onSave).not.toHaveBeenCalled()
	})

	it('supports direct value updates and blur flushes', () => {
		const onSave = vi.fn()
		const { result } = renderHook(() =>
			useAutoSave({
				initialValue: '',
				onSave,
				debounceMs: 1000,
				key: 'topic-1'
			})
		)

		act(() => {
			result.current.setValue('draft note')
		})

		expect(result.current.value).toBe('draft note')
		expect(onSave).not.toHaveBeenCalled()

		act(() => {
			result.current.flush()
		})

		expect(onSave).toHaveBeenCalledTimes(1)
		expect(onSave).toHaveBeenCalledWith('draft note')
	})
})
