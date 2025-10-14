import { useVirtualizer } from '@tanstack/react-virtual'
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState
} from 'react'
import { useResizeObserver } from '~/hooks/useResizeObserver'

interface MasonryLayoutProps<T> {
	items: Array<T>
	renderItem: (item: T, index: number) => ReactNode
	estimateItemSize: (item: T, index: number) => number
	minItemWidth?: number
	gap?: number
	overscan?: number
	getItemKey?: (item: T, index: number) => string | number
}

export function MasonryLayout<T>({
	items,
	renderItem,
	estimateItemSize,
	minItemWidth = 280,
	gap = 16,
	overscan = 5,
	getItemKey
}: MasonryLayoutProps<T>) {
	const [numLanes, setNumLanes] = useState(1)
	const [parentRef, rect] = useResizeObserver<HTMLDivElement>()

	const estimateSize = useMemo(
		() => (index: number) => {
			const item = items[index]
			if (!item) return 0
			return estimateItemSize(item, index)
		},
		[items, estimateItemSize]
	)

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => parentRef.current,
		estimateSize,
		overscan,
		lanes: numLanes,
		gap
	})

	useLayoutEffect(() => {
		if (numLanes > 0) {
			// Trigger virtualizer to re-measure when numLanes changes
			virtualizer.measure()
		}
	}, [virtualizer, numLanes])

	useEffect(() => {
		if (rect.width) {
			const calculatedLanes = Math.max(
				1,
				Math.floor((rect.width + gap) / (minItemWidth + gap))
			)

			if (calculatedLanes !== numLanes) setNumLanes(calculatedLanes)
		}
	}, [rect.width, numLanes, gap, minItemWidth])

	return (
		<div
			ref={parentRef}
			style={{
				height: `${virtualizer.getTotalSize()}px`,
				width: '100%',
				position: 'relative'
			}}
		>
			{virtualizer.getVirtualItems().map(virtualItem => {
				const item = items[virtualItem.index]!
				const key = getItemKey
					? getItemKey(item, virtualItem.index)
					: virtualItem.key

				return (
					<div
						className='absolute top-0'
						data-index={virtualItem.index}
						key={key}
						ref={virtualizer.measureElement}
						style={{
							left: `${virtualItem.lane * (100 / numLanes)}%`,
							width: `calc(${100 / numLanes}% - ${virtualItem.lane === numLanes - 1 ? 0 : gap}px)`,
							transform: `translateY(${virtualItem.start}px)`
						}}
					>
						{renderItem(item, virtualItem.index)}
					</div>
				)
			})}
		</div>
	)
}
