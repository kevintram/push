import { useEffect, useMemo, useRef, useState } from 'react'

type ObserverRect = Omit<DOMRectReadOnly, 'toJSON'>

const defaultState: ObserverRect = {
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	top: 0,
	left: 0,
	bottom: 0,
	right: 0
}

type CallbackRefWithCurrent<T> = React.RefCallback<T> & {
	readonly current: T | null
}

/**
 * Resize observer hook stolen from @mantine/hooks.
 * https://mantine.dev/hooks/use-resize-observer/
 */
export function useResizeObserver<T extends HTMLElement = any>(
	options?: ResizeObserverOptions
) {
	const frameID = useRef(0)
	const nodeRef = useRef<T | null>(null)
	const [node, setNode] = useState<T | null>(null)
	const [rect, setRect] = useState<ObserverRect>(defaultState)

	// Stable callable ref with .current getter for backward compatibility
	const ref = useMemo(() => {
		const fn = ((el: T | null) => {
			nodeRef.current = el
			setNode(el)
		}) as CallbackRefWithCurrent<T>
		Object.defineProperty(fn, 'current', {
			get: () => nodeRef.current,
			configurable: true
		})
		return fn
	}, [])

	const observer = useMemo(
		() =>
			typeof window !== 'undefined'
				? new ResizeObserver(entries => {
						const entry = entries[0]

						if (entry) {
							cancelAnimationFrame(frameID.current)

							frameID.current = requestAnimationFrame(() => {
								if (nodeRef.current) {
									const boxSize =
										entry.borderBoxSize?.[0] || entry.contentBoxSize?.[0]
									if (boxSize) {
										const width = boxSize.inlineSize
										const height = boxSize.blockSize

										setRect({
											width,
											height,
											x: entry.contentRect.x,
											y: entry.contentRect.y,
											top: entry.contentRect.top,
											left: entry.contentRect.left,
											bottom: entry.contentRect.bottom,
											right: entry.contentRect.right
										})
									} else {
										setRect(entry.contentRect)
									}
								}
							})
						}
					})
				: null,
		[]
	)

	useEffect(() => {
		if (node) {
			observer?.observe(node, options)
		}

		return () => {
			observer?.disconnect()

			if (frameID.current) {
				cancelAnimationFrame(frameID.current)
			}
		}
	}, [node, observer, options])

	return [ref, rect] as const
}

export function useElementSize<T extends HTMLElement = any>(
	options?: ResizeObserverOptions
) {
	const [ref, { width, height }] = useResizeObserver<T>(options)
	return { ref, width, height }
}
