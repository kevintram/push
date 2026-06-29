import {
	type CSSProperties,
	type KeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'

import {
	TOPIC_DETAIL_OUTLINE_MAX_WIDTH,
	TOPIC_DETAIL_OUTLINE_MIN_WIDTH,
} from './topicDetailLayout'

type UseTopicDetailOutlineSizingOptions = {
	onOutlineWidthChange: (width: number) => void
	outlineNodeCount: number
	outlineWidth: number
	pendingCreatedTopicId: number | null
	rootLabel: string
}

export function useTopicDetailOutlineSizing({
	onOutlineWidthChange,
	outlineNodeCount,
	outlineWidth,
	pendingCreatedTopicId,
	rootLabel,
}: UseTopicDetailOutlineSizingOptions) {
	const [footerHeight, setFooterHeight] = useState(0)
	const [outlineContentHeight, setOutlineContentHeight] = useState(0)
	const [outlineTopOffset, setOutlineTopOffset] = useState(0)
	const [viewportHeight, setViewportHeight] = useState(0)
	const footerRef = useRef<HTMLDivElement | null>(null)
	const outlineHeaderRef = useRef<HTMLDivElement | null>(null)
	const outlineNavRef = useRef<HTMLElement | null>(null)
	const outlineItemElementsRef = useRef(new Map<number, HTMLLIElement>())
	const outlineRef = useRef<HTMLElement | null>(null)
	const resizeCleanupRef = useRef<(() => void) | null>(null)
	const resizeFrameRef = useRef<number | null>(null)
	const resizeButtonRef = useRef<HTMLButtonElement | null>(null)
	const outlineWidthRef = useRef(outlineWidth)
	const pendingWidthRef = useRef(outlineWidth)
	const stickyTopOffset = 24

	const registerOutlineItemRef = useCallback(
		(topicId: number, element: HTMLLIElement | null) => {
			if (element == null) {
				outlineItemElementsRef.current.delete(topicId)
				return
			}

			outlineItemElementsRef.current.set(topicId, element)
		},
		[],
	)
	const clampOutlineWidth = useCallback(
		(width: number) =>
			Math.min(
				Math.max(width, TOPIC_DETAIL_OUTLINE_MIN_WIDTH),
				TOPIC_DETAIL_OUTLINE_MAX_WIDTH,
			),
		[],
	)
	const applyOutlineWidth = useCallback((nextWidth: number) => {
		outlineWidthRef.current = nextWidth
		pendingWidthRef.current = nextWidth

		if (resizeButtonRef.current) {
			resizeButtonRef.current.setAttribute(
				'aria-valuenow',
				nextWidth.toString(),
			)
		}

		if (resizeFrameRef.current !== null) return

		resizeFrameRef.current = requestAnimationFrame(() => {
			resizeFrameRef.current = null

			if (outlineRef.current) {
				outlineRef.current.style.width = `${pendingWidthRef.current}px`
			}
		})
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return

		const updateViewportMetrics = () => {
			setViewportHeight(window.innerHeight)
			setOutlineTopOffset(
				outlineRef.current?.getBoundingClientRect().top ??
					stickyTopOffset,
			)
		}

		updateViewportMetrics()
		window.addEventListener('resize', updateViewportMetrics)

		return () => {
			window.removeEventListener('resize', updateViewportMetrics)
		}
	}, [])

	useEffect(
		() => () => {
			resizeCleanupRef.current?.()
			if (resizeFrameRef.current !== null) {
				cancelAnimationFrame(resizeFrameRef.current)
			}
		},
		[],
	)

	useEffect(() => {
		if (typeof ResizeObserver === 'undefined') return

		const headerElement = outlineHeaderRef.current
		const navElement = outlineNavRef.current
		const footerElement = footerRef.current

		if (!(headerElement || navElement || footerElement)) return

		const updateMeasuredHeights = () => {
			const headerHeight =
				headerElement?.getBoundingClientRect().height ?? 0
			const navHeight = navElement?.scrollHeight ?? 0
			setOutlineContentHeight(headerHeight + navHeight)
			setFooterHeight(footerElement?.getBoundingClientRect().height ?? 0)
		}

		const observer = new ResizeObserver(() => {
			updateMeasuredHeights()
		})

		if (headerElement) observer.observe(headerElement)
		if (navElement) observer.observe(navElement)
		if (footerElement) observer.observe(footerElement)

		updateMeasuredHeights()

		return () => {
			observer.disconnect()
		}
	}, [outlineNodeCount, rootLabel])

	useEffect(() => {
		if (pendingCreatedTopicId == null) return

		const outlineItem = outlineItemElementsRef.current.get(
			pendingCreatedTopicId,
		)
		if (outlineItem == null) return

		const scrollOutlineItemIntoView = () => {
			outlineItem.scrollIntoView({
				block: 'nearest',
				inline: 'nearest',
			})
		}

		if (typeof window === 'undefined') {
			scrollOutlineItemIntoView()
			return
		}

		window.requestAnimationFrame(scrollOutlineItemIntoView)
	}, [pendingCreatedTopicId])

	useEffect(() => {
		outlineWidthRef.current = outlineWidth
		pendingWidthRef.current = outlineWidth

		if (outlineRef.current) {
			outlineRef.current.style.width = `${outlineWidth}px`
		}

		if (resizeButtonRef.current) {
			resizeButtonRef.current.setAttribute(
				'aria-valuenow',
				outlineWidth.toString(),
			)
		}
	}, [outlineWidth])

	const outlineRailStyle = useMemo<CSSProperties | undefined>(() => {
		if (viewportHeight <= stickyTopOffset) return

		const maxOutlineHeight = Math.max(
			viewportHeight - outlineTopOffset - stickyTopOffset,
			0,
		)
		const desiredOutlineHeight = outlineContentHeight + footerHeight
		return {
			height:
				desiredOutlineHeight > 0
					? `${Math.min(desiredOutlineHeight, maxOutlineHeight)}px`
					: 'fit-content',
			maxHeight: `${maxOutlineHeight}px`,
		}
	}, [footerHeight, outlineContentHeight, outlineTopOffset, viewportHeight])
	const outlineListStyle = useMemo<CSSProperties | undefined>(() => {
		if (viewportHeight <= stickyTopOffset) return
		if (outlineContentHeight <= 0 || footerHeight <= 0) return

		const maxOutlineHeight = Math.max(
			viewportHeight - outlineTopOffset - stickyTopOffset,
			0,
		)
		const maxListHeight = Math.max(maxOutlineHeight - footerHeight, 0)

		return {
			height: `${Math.min(outlineContentHeight, maxListHeight)}px`,
		}
	}, [footerHeight, outlineContentHeight, outlineTopOffset, viewportHeight])
	const asideStyle = useMemo<CSSProperties>(
		() => ({
			...outlineRailStyle,
			width: `${outlineWidth}px`,
		}),
		[outlineRailStyle, outlineWidth],
	)
	const handleResizeStart = useCallback(
		(event: ReactPointerEvent<HTMLButtonElement>) => {
			if (event.button !== 0) return

			const startX = event.clientX
			const startWidth = outlineWidthRef.current
			const originalCursor = document.body.style.cursor
			const originalUserSelect = document.body.style.userSelect

			const cleanup = () => {
				window.removeEventListener('pointermove', handlePointerMove)
				window.removeEventListener('pointerup', handlePointerUp)
				document.body.style.cursor = originalCursor
				document.body.style.userSelect = originalUserSelect
				resizeCleanupRef.current = null
			}

			const handlePointerMove = (moveEvent: PointerEvent) => {
				applyOutlineWidth(
					clampOutlineWidth(
						startWidth + (moveEvent.clientX - startX),
					),
				)
			}

			const handlePointerUp = () => {
				const finalWidth = outlineWidthRef.current
				cleanup()
				onOutlineWidthChange(finalWidth)
			}

			resizeCleanupRef.current?.()
			resizeCleanupRef.current = cleanup
			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'
			window.addEventListener('pointermove', handlePointerMove)
			window.addEventListener('pointerup', handlePointerUp)
		},
		[applyOutlineWidth, clampOutlineWidth, onOutlineWidthChange],
	)
	const handleResizeKeyDown = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>) => {
			if (event.key === 'ArrowLeft') {
				event.preventDefault()
				const nextWidth = clampOutlineWidth(
					outlineWidthRef.current - 16,
				)
				applyOutlineWidth(nextWidth)
				onOutlineWidthChange(nextWidth)
				return
			}

			if (event.key === 'ArrowRight') {
				event.preventDefault()
				const nextWidth = clampOutlineWidth(
					outlineWidthRef.current + 16,
				)
				applyOutlineWidth(nextWidth)
				onOutlineWidthChange(nextWidth)
				return
			}

			if (event.key === 'Home') {
				event.preventDefault()
				applyOutlineWidth(TOPIC_DETAIL_OUTLINE_MIN_WIDTH)
				onOutlineWidthChange(TOPIC_DETAIL_OUTLINE_MIN_WIDTH)
				return
			}

			if (event.key === 'End') {
				event.preventDefault()
				applyOutlineWidth(TOPIC_DETAIL_OUTLINE_MAX_WIDTH)
				onOutlineWidthChange(TOPIC_DETAIL_OUTLINE_MAX_WIDTH)
			}
		},
		[applyOutlineWidth, clampOutlineWidth, onOutlineWidthChange],
	)

	return {
		asideStyle,
		footerRef,
		handleResizeKeyDown,
		handleResizeStart,
		outlineHeaderRef,
		outlineListStyle,
		outlineNavRef,
		outlineRef,
		registerOutlineItemRef,
		resizeButtonRef,
	}
}
