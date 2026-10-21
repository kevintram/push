import {
	createContext,
	use,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'

/** Holds the enclosing popover open; returns the matching release. */
type HoldPopoverOpen = () => () => void

export const PopoverHoldContext = createContext<HoldPopoverOpen | null>(null)

/**
 * Keeps the enclosing hover popover open while `active`, for menus and
 * dialogs that portal outside it and would otherwise close it, unmounting
 * themselves. Does nothing outside a `PopoverHoldContext`.
 */
export function useHoldPopoverOpen(active: boolean) {
	const hold = use(PopoverHoldContext)
	useEffect(() => (active && hold ? hold() : undefined), [active, hold])
}

/**
 * Open state for a hover popover whose content can hold it open through
 * `PopoverHoldContext`. A close requested while held waits for the last
 * release. Base UI stops tracking hover once a close is refused, so the
 * deferred close then happens on the first pointer move outside both
 * `popupRef` and `triggerRef`. Closing over the trigger would leave it shut,
 * since Base UI only opens on the trigger's `mouseenter`.
 *
 * Base UI only keeps a hover popover open for popups nested in its own
 * floating tree. Context menus start their own tree, and dialogs and dnd-kit
 * drags aren't in one, so all three would close it without this.
 */
export function useHoldablePopover() {
	const [open, setOpen] = useState(false)
	const popupRef = useRef<HTMLDivElement>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const holdCount = useRef(0)
	const isCloseDeferred = useRef(false)
	const stopWatchingPointer = useRef<(() => void) | undefined>(undefined)

	const changeOpen = useCallback((nextOpen: boolean) => {
		stopWatchingPointer.current?.()
		stopWatchingPointer.current = undefined
		setOpen(nextOpen)
	}, [])

	useEffect(() => () => stopWatchingPointer.current?.(), [])

	const hold = useCallback<HoldPopoverOpen>(() => {
		holdCount.current += 1
		return () => {
			holdCount.current -= 1
			// Waits a task so a menu item that opens a dialog hands its hold
			// to the dialog before the deferred close runs.
			setTimeout(() => {
				if (holdCount.current > 0 || !isCloseDeferred.current) return
				isCloseDeferred.current = false
				const closeOutsidePopupAndTrigger = (event: PointerEvent) => {
					const isOverPopupOrTrigger = [popupRef, triggerRef].some(
						({ current }) =>
							current &&
							isPointInRect(
								event,
								current.getBoundingClientRect(),
							),
					)
					if (isOverPopupOrTrigger) return
					changeOpen(false)
				}
				document.addEventListener(
					'pointermove',
					closeOutsidePopupAndTrigger,
				)
				stopWatchingPointer.current = () =>
					document.removeEventListener(
						'pointermove',
						closeOutsidePopupAndTrigger,
					)
			})
		}
	}, [changeOpen])

	const onOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen && holdCount.current > 0) {
				isCloseDeferred.current = true
				return
			}
			changeOpen(nextOpen)
		},
		[changeOpen],
	)

	return { open, onOpenChange, popupRef, triggerRef, hold }
}

function isPointInRect(
	{ clientX, clientY }: PointerEvent,
	{ left, right, top, bottom }: DOMRect,
) {
	return (
		clientX >= left &&
		clientX <= right &&
		clientY >= top &&
		clientY <= bottom
	)
}
