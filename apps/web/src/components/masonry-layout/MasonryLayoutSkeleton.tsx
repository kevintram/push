import { useCallback, useMemo } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Skeleton } from '~/components/ui/Skeleton'

interface MasonryLayoutSkeletonProps {
	count?: number
	gap?: number
	minItemWidth?: number
}

// Deterministic pseudo-random based on index (avoids re-render flicker)
function seededRandom(index: number) {
	const x = Math.sin(index * 9301 + 49_297) * 49_297
	return x - Math.floor(x)
}

const TITLE_WIDTHS = ['w-1/2', 'w-3/5', 'w-2/3', 'w-3/4', 'w-4/5'] as const
const BODY_WIDTHS = ['w-2/3', 'w-3/4', 'w-4/5', 'w-5/6'] as const

interface SkeletonVariant {
	titleLines: number
	titleWidth: string
	bodyLineCount: number
	bodyWidth: string
}

function getVariant(index: number): SkeletonVariant {
	const r1 = seededRandom(index)
	const r2 = seededRandom(index + 100)
	const r3 = seededRandom(index + 200)
	const r4 = seededRandom(index + 300)

	// Title: 1 line ~70%, 2 lines ~30%
	const titleLines = r4 < 0.7 ? 1 : 2

	// Body lines 0-8, weighted toward middle
	// 0: ~10%, 1: ~20%, 2: ~20%, 3: ~15%, 4: ~10%, 5: ~8%, 6: ~7%, 7: ~5%, 8: ~5%
	let bodyLineCount: number
	if (r3 < 0.1) bodyLineCount = 0
	else if (r3 < 0.3) bodyLineCount = 1
	else if (r3 < 0.5) bodyLineCount = 2
	else if (r3 < 0.65) bodyLineCount = 3
	else if (r3 < 0.75) bodyLineCount = 4
	else if (r3 < 0.83) bodyLineCount = 5
	else if (r3 < 0.9) bodyLineCount = 6
	else if (r3 < 0.95) bodyLineCount = 7
	else bodyLineCount = 8

	return {
		titleLines,
		titleWidth: TITLE_WIDTHS[Math.floor(r1 * TITLE_WIDTHS.length)] ?? 'w-3/4',
		bodyLineCount,
		bodyWidth: BODY_WIDTHS[Math.floor(r2 * BODY_WIDTHS.length)] ?? 'w-3/4'
	}
}

// Chrome: header (~28px) + footer (~20px) + padding/gaps (~52px) = ~100px
// Each content line adds ~20px
const BASE_HEIGHT = 100
const LINE_HEIGHT = 20

export function MasonryLayoutSkeleton({
	count = 60,
	gap = 16,
	minItemWidth = 280
}: MasonryLayoutSkeletonProps) {
	const skeletonItems = useMemo(
		() => Array.from({ length: count }, (_, i) => i),
		[count]
	)

	const estimateItemSize = useCallback(
		(_item: number, index: number, _laneWidth: number) => {
			const variant = getVariant(index)
			return (
				BASE_HEIGHT + (variant.titleLines + variant.bodyLineCount) * LINE_HEIGHT
			)
		},
		[]
	)

	const renderItem = useCallback(
		(_item: number, index: number, _laneWidth: number) => {
			const variant = getVariant(index)
			const bodyLines = Array.from(
				{ length: variant.bodyLineCount },
				(_, i) => {
					const width =
						i === variant.bodyLineCount - 1 ? 'w-1/3' : variant.bodyWidth
					return <Skeleton className={`h-4 ${width}`} key={i} />
				}
			)
			return (
				<div className='flex flex-col gap-2 rounded-xl border py-3'>
					{/* Header row */}
					<div className='flex items-start justify-between gap-2 px-3'>
						<Skeleton className='h-3 w-8' />
						<div className='flex-1' />
						<Skeleton className='h-4 w-4 rounded-sm' />
						<Skeleton className='h-4 w-4 rounded-sm' />
						<Skeleton className='h-4 w-4 rounded-sm' />
					</div>

					{/* Content: title + body text */}
					<div className='flex flex-col gap-1 px-3'>
						<Skeleton className={`h-5 ${variant.titleWidth}`} />
						{variant.titleLines === 2 && <Skeleton className='h-5 w-2/5' />}
						{bodyLines}
					</div>

					{/* Footer */}
					<div className='flex items-center gap-1 px-3'>
						<Skeleton className='h-3 w-16' />
						<Skeleton className='h-3 w-1' />
						<Skeleton className='h-3 w-24' />
						<div className='flex-1' />
						<Skeleton className='h-3 w-6' />
					</div>
				</div>
			)
		},
		[]
	)

	const getItemKey = useCallback((_item: number, index: number) => index, [])

	return (
		<MasonryLayout
			estimateItemSize={estimateItemSize}
			gap={gap}
			getItemKey={getItemKey}
			items={skeletonItems}
			minItemWidth={minItemWidth}
			renderItem={renderItem}
		/>
	)
}
