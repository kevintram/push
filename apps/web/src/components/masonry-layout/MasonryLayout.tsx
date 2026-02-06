import { useVirtualizer } from '@tanstack/react-virtual'
import {
	memo,
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import { usePageScrollElement } from '~/app/layouts/PageLayout'
import { useResizeObserver } from '~/hooks/useResizeObserver'

interface MasonryLayoutProps<T> {
	items: Array<T>
	renderItem: (item: T, index: number, laneWidth: number) => ReactNode
	estimateItemSize: (item: T, index: number, laneWidth: number) => number
	minItemWidth?: number
	gap?: number
	overscan?: number
	getItemKey?: (item: T, index: number) => string | number
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
}

function MasonryLayoutInner<T>({
	items,
	renderItem,
	estimateItemSize,
	minItemWidth = 280,
	gap = 16,
	overscan,
	getItemKey,
	getScrollElement,
	scrollMargin
}: MasonryLayoutProps<T>) {
	const [autoScrollMargin, setAutoScrollMargin] = useState(0)
	// Issue 4: Split ResizeObserver from virtual container
	const [widthRef, rect] = useResizeObserver<HTMLDivElement>()
	const parentRef = useRef<HTMLDivElement>(null)
	const pageGetScrollElement = usePageScrollElement()

	const itemsRef = useRef(items)
	itemsRef.current = items
	const lastEstimateRef = useRef(96)
	const warnedMissingKeyRef = useRef(false)
	const prevLayoutRef = useRef<{ numLanes: number; laneWidth: number } | null>(
		null
	)

	const numLanes = useMemo(
		() =>
			rect.width
				? Math.max(1, Math.floor((rect.width + gap) / (minItemWidth + gap)))
				: 1,
		[rect.width, gap, minItemWidth]
	)
	const hasMeasuredWidth = rect.width > 0

	const laneWidth = useMemo(() => {
		if (numLanes > 0 && rect.width > 0) {
			return (rect.width - (numLanes - 1) * gap) / numLanes
		}
		return minItemWidth
	}, [numLanes, rect.width, gap, minItemWidth])

	const estimateSize = useCallback(
		(index: number) => {
			const item = itemsRef.current[index]
			if (!item) {
				return lastEstimateRef.current
			}
			const nextEstimate = estimateItemSize(item, index, laneWidth)
			if (nextEstimate > 0) {
				lastEstimateRef.current = nextEstimate
			}
			return nextEstimate
		},
		[estimateItemSize, laneWidth]
	)

	const resolvedGetScrollElement = useCallback(
		() => getScrollElement?.() ?? pageGetScrollElement?.() ?? null,
		[getScrollElement, pageGetScrollElement]
	)

	// Issue 1: Forward getItemKey to virtualizer
	const virtualizerGetItemKey = useMemo(() => {
		if (!getItemKey) return
		return (index: number) => {
			const item = itemsRef.current[index]
			if (!item) {
				if (import.meta.env.DEV && !warnedMissingKeyRef.current) {
					warnedMissingKeyRef.current = true
				}
				return `__missing__${index}`
			}
			return getItemKey(item, index)
		}
	}, [getItemKey])

	const resolvedOverscan = overscan ?? numLanes * 3

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: resolvedGetScrollElement,
		estimateSize,
		overscan: resolvedOverscan,
		lanes: numLanes,
		gap,
		scrollMargin: scrollMargin ?? autoScrollMargin,
		getItemKey: virtualizerGetItemKey
	})

	useLayoutEffect(() => {
		if (!hasMeasuredWidth) return

		if (prevLayoutRef.current == null) {
			prevLayoutRef.current = { numLanes, laneWidth }
			return
		}

		if (
			prevLayoutRef.current.numLanes !== numLanes ||
			prevLayoutRef.current.laneWidth !== laneWidth
		) {
			prevLayoutRef.current = { numLanes, laneWidth }
			virtualizer.measure()
		}
	}, [virtualizer, numLanes, laneWidth, hasMeasuredWidth])

	// Compute scrollMargin via bounding rects (layout-independent)
	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally retrigger this setup when list shape changes can shift vertical offsets.
	useLayoutEffect(() => {
		if (scrollMargin != null) return
		const scrollEl = resolvedGetScrollElement()
		const parentEl = parentRef.current
		if (!(scrollEl && parentEl) || scrollEl === parentEl) {
			setAutoScrollMargin(0)
			return
		}

		let raf = 0
		const updateOffset = () => {
			const scrollRect = scrollEl.getBoundingClientRect()
			const parentRect = parentEl.getBoundingClientRect()
			const nextOffset = parentRect.top - scrollRect.top + scrollEl.scrollTop
			setAutoScrollMargin(prev => (prev === nextOffset ? prev : nextOffset))
		}
		const scheduleUpdate = () => {
			if (raf) return
			raf = requestAnimationFrame(() => {
				raf = 0
				updateOffset()
			})
		}

		updateOffset()

		const resizeObserver = new ResizeObserver(() => scheduleUpdate())
		resizeObserver.observe(scrollEl)
		resizeObserver.observe(parentEl)
		const scrollContentEl =
			scrollEl.firstElementChild instanceof HTMLElement
				? scrollEl.firstElementChild
				: null
		if (scrollContentEl) {
			resizeObserver.observe(scrollContentEl)
		}

		const mutationContainer = parentEl.parentElement
		const mutationObserver = new MutationObserver(() => {
			scheduleUpdate()
		})
		if (mutationContainer) {
			// Only watch direct container-level changes that can move this masonry block.
			mutationObserver.observe(mutationContainer, {
				childList: true,
				subtree: false
			})
			// Also watch container class/style changes (no subtree observation).
			mutationObserver.observe(mutationContainer, {
				attributes: true,
				attributeFilter: ['class', 'style']
			})
		}

		const handleScroll = () => scheduleUpdate()
		const handleWindowResize = () => scheduleUpdate()
		scrollEl.addEventListener('scroll', handleScroll, { passive: true })
		window.addEventListener('resize', handleWindowResize)

		return () => {
			scrollEl.removeEventListener('scroll', handleScroll)
			window.removeEventListener('resize', handleWindowResize)
			resizeObserver.disconnect()
			mutationObserver.disconnect()
			if (raf) {
				cancelAnimationFrame(raf)
			}
		}
	}, [resolvedGetScrollElement, scrollMargin, items.length, numLanes])

	useEffect(() => {
		if (import.meta.env.DEV) {
			const explicit = getScrollElement?.()
			const page = pageGetScrollElement?.()
			if (!(explicit || page)) {
			}
		}
	}, [getScrollElement, pageGetScrollElement])

	// Issue 3: Pre-compute lane sizing for equal widths
	const totalGapPx = (numLanes - 1) * gap

	return (
		// Issue 4: Outer wrapper for ResizeObserver, inner for virtualizer
		<div ref={widthRef} style={{ width: '100%' }}>
			<div
				ref={parentRef}
				style={{
					height: hasMeasuredWidth ? `${virtualizer.getTotalSize()}px` : '0px',
					width: '100%',
					position: 'relative'
				}}
			>
				{(hasMeasuredWidth ? virtualizer.getVirtualItems() : []).map(
					virtualItem => {
						const item = items[virtualItem.index]!

						return (
							<div
								className='absolute top-0'
								data-index={virtualItem.index}
								// Issue 1: Use virtualizer's key (which now uses our getItemKey)
								key={virtualItem.key}
								ref={virtualizer.measureElement}
								style={{
									// Issue 3: Equal lane widths
									left: `calc(${virtualItem.lane} * ((100% - ${totalGapPx}px) / ${numLanes} + ${gap}px))`,
									width: `calc((100% - ${totalGapPx}px) / ${numLanes})`,
									transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`
								}}
							>
								{renderItem(item, virtualItem.index, laneWidth)}
							</div>
						)
					}
				)}
			</div>
		</div>
	)
}

// Issue 9: Wrap in React.memo
export const MasonryLayout = memo(MasonryLayoutInner) as <T>(
	props: MasonryLayoutProps<T>
) => ReactNode
