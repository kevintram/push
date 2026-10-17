import { useEffect, useState } from 'react'

export type OffscreenDirection = 'above' | 'below'

/**
 * Which way `target` lies outside the visible area of the scroll container
 * `root`, or undefined while any part of it is visible. The root's scroll
 * padding counts as outside, so a target is offscreen exactly when
 * `scrollIntoView({ block: 'nearest' })` would have to scroll to it. A target
 * that is not rendered, such as one inside a collapsed branch, has no
 * direction.
 *
 * Remeasures when the root scrolls, when it or its content resizes, such as a
 * branch above the target opening, and when elements inside it are added,
 * removed, or moved, which can shift the target without changing any size.
 * An IntersectionObserver would miss a target that moves from one side to the
 * other without becoming visible.
 */
export function useOffscreenDirection(
	root: HTMLElement | null,
	target: HTMLElement | null,
): OffscreenDirection | undefined {
	const [direction, setDirection] = useState<OffscreenDirection>()

	useEffect(() => {
		if (!root || !target) return

		const style = getComputedStyle(root)
		const paddingTop = parseFloat(style.scrollPaddingTop) || 0
		const paddingBottom = parseFloat(style.scrollPaddingBottom) || 0

		const measure = () => {
			if (target.getClientRects().length === 0) {
				setDirection(undefined)
				return
			}

			const rootRect = root.getBoundingClientRect()
			const targetRect = target.getBoundingClientRect()

			if (targetRect.bottom <= rootRect.top + paddingTop) {
				setDirection('above')
			} else if (targetRect.top >= rootRect.bottom - paddingBottom) {
				setDirection('below')
			} else {
				setDirection(undefined)
			}
		}

		measure()
		root.addEventListener('scroll', measure, { passive: true })
		const resizeObserver = new ResizeObserver(measure)
		resizeObserver.observe(root)
		for (const child of root.children) resizeObserver.observe(child)
		const mutationObserver = new MutationObserver(measure)
		mutationObserver.observe(root, { childList: true, subtree: true })

		return () => {
			root.removeEventListener('scroll', measure)
			resizeObserver.disconnect()
			mutationObserver.disconnect()
			setDirection(undefined)
		}
	}, [root, target])

	return direction
}
