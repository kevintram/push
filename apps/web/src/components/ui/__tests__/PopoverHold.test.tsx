import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useHoldablePopover } from '../Popover'

describe('useHoldablePopover', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	// Opens a popover whose popup spans (0, 0) to (100, 100), beside a
	// trigger spanning (-50, 0) to (-10, 40).
	function renderOpenPopover() {
		vi.useFakeTimers()
		const popup = document.createElement('div')
		popup.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100)
		const trigger = document.createElement('button')
		trigger.getBoundingClientRect = () => new DOMRect(-50, 0, 40, 40)
		const { result } = renderHook(() => useHoldablePopover())
		result.current.popupRef.current = popup
		result.current.triggerRef.current = trigger
		act(() => result.current.onOpenChange(true))
		return result
	}

	function release(releaseHold: () => void) {
		act(() => {
			releaseHold()
			vi.runAllTimers()
		})
	}

	function movePointer(clientX: number, clientY: number) {
		act(() => {
			document.dispatchEvent(
				new MouseEvent('pointermove', { clientX, clientY }),
			)
		})
	}

	it('opens and closes freely while nothing holds it', () => {
		const result = renderOpenPopover()
		expect(result.current.open).toBe(true)

		act(() => result.current.onOpenChange(false))

		expect(result.current.open).toBe(false)
	})

	it('defers a close requested while held until the pointer leaves after the last release', () => {
		const result = renderOpenPopover()
		const releaseMenu = result.current.hold()
		const releaseDialog = result.current.hold()

		act(() => result.current.onOpenChange(false))
		release(releaseMenu)
		movePointer(200, 200)
		expect(result.current.open).toBe(true)

		release(releaseDialog)
		movePointer(50, 50)
		expect(result.current.open).toBe(true)
		movePointer(200, 200)
		expect(result.current.open).toBe(false)
	})

	it('defers the close while the pointer is over the trigger', () => {
		const result = renderOpenPopover()
		const releaseHold = result.current.hold()
		act(() => result.current.onOpenChange(false))
		release(releaseHold)

		movePointer(-30, 20)
		expect(result.current.open).toBe(true)
		movePointer(-30, 200)
		expect(result.current.open).toBe(false)
	})

	it('stays open when one hold passes to the next', () => {
		const result = renderOpenPopover()
		const releaseMenu = result.current.hold()

		act(() => result.current.onOpenChange(false))
		releaseMenu()
		const releaseDialog = result.current.hold()
		act(() => vi.runAllTimers())
		movePointer(200, 200)
		expect(result.current.open).toBe(true)

		release(releaseDialog)
		movePointer(200, 200)
		expect(result.current.open).toBe(false)
	})

	it('stays open after the last release when no close was requested', () => {
		const result = renderOpenPopover()

		release(result.current.hold())
		movePointer(200, 200)

		expect(result.current.open).toBe(true)
	})

	it('stops waiting for the pointer once the popover reopens', () => {
		const result = renderOpenPopover()
		const releaseHold = result.current.hold()
		act(() => result.current.onOpenChange(false))
		release(releaseHold)

		act(() => result.current.onOpenChange(false))
		act(() => result.current.onOpenChange(true))
		movePointer(200, 200)

		expect(result.current.open).toBe(true)
	})
})
