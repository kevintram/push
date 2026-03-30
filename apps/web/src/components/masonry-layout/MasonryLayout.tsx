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

const LANE_WIDTH_REMEASURE_THRESHOLD_PX = 5

// Lane-change reflow constants:
// When the number of masonry lanes changes (e.g. a window resize crosses a
// breakpoint), virtualizer.measure() clears its itemSizeCache. Until items are
// re-measured from the DOM, the virtualizer falls back to estimateSize() which
// is less accurate after major width changes (text reflows differently at
// different widths). This causes temporary under-mounting and visible gaps.
//
// To fix this we run a short "reflow" phase:
//  1. Temporarily increase overscan so more items are mounted immediately,
//     giving the virtualizer more real DOM nodes to measure.
//  2. Remeasure all mounted items every frame for a few frames, progressively
//     replacing stale estimates with actual heights until the layout stabilizes.
//
// Trade-off: slightly more work for a few frames after lane-count changes.
// The normal scrolling/resizing path is completely unaffected.
const LANE_CHANGE_REFLOW_FRAMES = 6
const LANE_CHANGE_OVERSCAN_MULTIPLIER = 12

interface MasonryLayoutProps<T> {
	items: Array<T>
	renderItem: (item: T, index: number, laneWidth: number) => ReactNode
	estimateItemSize: (item: T, index: number, laneWidth: number) => number
	measurementVersion?: boolean | number | string | null
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
	measurementVersion,
	minItemWidth = 300,
	gap = 16,
	overscan,
	getItemKey,
	getScrollElement,
	scrollMargin
}: MasonryLayoutProps<T>) {
	const [autoScrollMargin, setAutoScrollMargin] = useState(0)
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
	const laneWidthRemeasureRafRef = useRef<number | null>(null)
	const laneChangeReflowRafRef = useRef<number | null>(null)
	const [isLaneReflowing, setIsLaneReflowing] = useState(false)
	const previousMeasurementVersionRef = useRef(measurementVersion)

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

	// During a lane-change reflow, temporarily inflate overscan so the
	// virtualizer mounts enough items to fill the new layout. This gives
	// the reflow tick loop (below) more DOM nodes to measure, which speeds
	// up convergence from estimates → real heights.
	const baseOverscan = overscan ?? numLanes * 3
	const resolvedOverscan = isLaneReflowing
		? Math.max(baseOverscan, numLanes * LANE_CHANGE_OVERSCAN_MULTIPLIER)
		: baseOverscan

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

	// --- Measurement helpers ---
	// These form a layered API for re-measuring virtualizer items:
	//   measureMountedElements  – sync: measure all mounted [data-index] nodes
	//   remeasureMountedItems   – async: debounced single-frame RAF wrapper
	//   resetMeasurements       – clear virtualizer cache + remeasureMountedItems
	//   runLaneReflow           – multi-frame RAF loop with boosted overscan

	// Synchronously measure all mounted virtual items in the DOM.
	const measureMountedElements = useCallback(() => {
		const parentEl = parentRef.current
		if (!parentEl) return
		for (const el of parentEl.querySelectorAll<HTMLElement>('[data-index]')) {
			virtualizer.measureElement(el)
		}
	}, [virtualizer])

	// Debounced single-frame remeasure (used for width-only changes).
	const remeasureMountedItems = useCallback(() => {
		if (laneWidthRemeasureRafRef.current != null) {
			cancelAnimationFrame(laneWidthRemeasureRafRef.current)
		}
		laneWidthRemeasureRafRef.current = requestAnimationFrame(() => {
			laneWidthRemeasureRafRef.current = null
			measureMountedElements()
		})
	}, [measureMountedElements])

	// Runs a multi-frame reflow after lane-count changes. Each animation frame:
	//  1. Calls measureMountedElements() to replace estimate-based heights with
	//     real DOM measurements. The first few passes may still see estimates
	//     because React needs a render to mount newly-overscan'd items.
	//  2. Schedules the next frame until LANE_CHANGE_REFLOW_FRAMES is exhausted.
	// While active, isLaneReflowing=true keeps overscan inflated (see above)
	// so the virtualizer mounts enough items to fill the wider/narrower layout.
	const runLaneReflow = useCallback(() => {
		if (laneChangeReflowRafRef.current != null) {
			cancelAnimationFrame(laneChangeReflowRafRef.current)
		}
		setIsLaneReflowing(true)
		let remaining = LANE_CHANGE_REFLOW_FRAMES

		const tick = () => {
			measureMountedElements()
			if (--remaining <= 0) {
				laneChangeReflowRafRef.current = null
				setIsLaneReflowing(false)
				return
			}
			laneChangeReflowRafRef.current = requestAnimationFrame(tick)
		}
		laneChangeReflowRafRef.current = requestAnimationFrame(tick)
	}, [measureMountedElements])

	const resetMeasurements = useCallback(() => {
		virtualizer.measure()
		runLaneReflow()
	}, [runLaneReflow, virtualizer])

	useLayoutEffect(() => {
		if (!hasMeasuredWidth) return

		if (prevLayoutRef.current == null) {
			prevLayoutRef.current = { numLanes, laneWidth }
			return
		}

		const laneCountChanged = prevLayoutRef.current.numLanes !== numLanes
		const laneWidthDelta = Math.abs(prevLayoutRef.current.laneWidth - laneWidth)

		prevLayoutRef.current = { numLanes, laneWidth }

		// Lane count changed (e.g. 1 → 7 after widening the window).
		// Clear the size cache so items fall back to estimateSize(), then start
		// the multi-frame reflow which will progressively replace those estimates
		// with real DOM heights over the next few frames.
		if (laneCountChanged) {
			resetMeasurements()
			return
		}

		// For width-only changes (e.g. sidebar animation with stable lane count),
		// keep cached measurements and just remeasure mounted items per frame.
		// This avoids "estimate flash" while still updating card heights.
		if (laneWidthDelta >= LANE_WIDTH_REMEASURE_THRESHOLD_PX) {
			remeasureMountedItems()
		}
	}, [
		remeasureMountedItems,
		numLanes,
		laneWidth,
		hasMeasuredWidth,
		resetMeasurements
	])

	useLayoutEffect(() => {
		if (!hasMeasuredWidth) return

		const previousMeasurementVersion = previousMeasurementVersionRef.current
		previousMeasurementVersionRef.current = measurementVersion

		if (
			measurementVersion === undefined ||
			Object.is(previousMeasurementVersion, measurementVersion)
		) {
			return
		}

		// Item content can change without item keys changing. Invalidate cached
		// sizes so off-screen items do not keep stale heights from the prior mode.
		resetMeasurements()
	}, [hasMeasuredWidth, measurementVersion, resetMeasurements])

	useEffect(
		() => () => {
			if (laneWidthRemeasureRafRef.current != null) {
				cancelAnimationFrame(laneWidthRemeasureRafRef.current)
			}
			if (laneChangeReflowRafRef.current != null) {
				cancelAnimationFrame(laneChangeReflowRafRef.current)
			}
		},
		[]
	)

	useEffect(() => {
		const handleTransitionEnd = (event: TransitionEvent) => {
			const target = event.target
			if (!(target instanceof HTMLElement)) return
			if (
				event.propertyName !== 'width' &&
				event.propertyName !== 'left' &&
				event.propertyName !== 'right'
			) {
				return
			}

			const isSidebarTransitionTarget =
				target.matches('[data-slot="sidebar-gap"]') ||
				target.matches('[data-slot="sidebar-container"]')

			if (!isSidebarTransitionTarget) return
			virtualizer.measure()
			remeasureMountedItems()
		}

		document.addEventListener('transitionend', handleTransitionEnd, true)
		return () => {
			document.removeEventListener('transitionend', handleTransitionEnd, true)
		}
	}, [virtualizer, remeasureMountedItems])

	// Compute scrollMargin via bounding rects (layout-independent).
	// Keep this observer setup stable across item-count changes so pagination
	// updates do not teardown/re-init the effect and risk scroll jumps.
	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally keep a narrow dependency set; observers below react to runtime layout shifts.
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
			const nextOffset = Math.round(
				parentRect.top - scrollRect.top + scrollEl.scrollTop
			)
			setAutoScrollMargin(prev =>
				Math.abs(prev - nextOffset) < 1 ? prev : nextOffset
			)
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

		const handleWindowResize = () => scheduleUpdate()
		window.addEventListener('resize', handleWindowResize)

		return () => {
			window.removeEventListener('resize', handleWindowResize)
			resizeObserver.disconnect()
			mutationObserver.disconnect()
			if (raf) {
				cancelAnimationFrame(raf)
			}
		}
	}, [resolvedGetScrollElement, scrollMargin, numLanes])

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
