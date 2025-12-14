import { useMemo } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Skeleton } from '~/components/ui/Skeleton'

interface MasonryLayoutSkeletonProps {
	count?: number
	gap?: number
	minItemWidth?: number
}

export function MasonryLayoutSkeleton({
	count = 30,
	gap = 16,
	minItemWidth = 280
}: MasonryLayoutSkeletonProps) {
	const skeletonItems = useMemo(
		() => Array.from({ length: count }, (_, i) => i),
		[count]
	)

	const estimateItemSize = useMemo(
		() => (_item: number, _index: number) => {
			// Estimate height based on skeleton card structure:
			// padding (16px top) + title (20px) + gap (12px) + line1 (16px) + gap (12px) + line2 (16px) + gap (12px) + button (32px) + padding (16px bottom)
			return 140
		},
		[]
	)

	const renderItem = useMemo(
		() => (_item: number, _index: number) => (
			<div className='space-y-3 rounded-lg border p-4'>
				<Skeleton className='h-5 w-3/4' />
				<Skeleton className='h-4 w-5/6' />
				<Skeleton className='h-4 w-2/3' />
				<div className='flex justify-end'>
					<Skeleton className='h-8 w-24' />
				</div>
			</div>
		),
		[]
	)

	const getItemKey = useMemo(
		() => (_item: number, index: number) => `skeleton-${index}`,
		[]
	)

	return (
		<div className='p-6'>
			<MasonryLayout
				estimateItemSize={estimateItemSize}
				gap={gap}
				getItemKey={getItemKey}
				items={skeletonItems}
				minItemWidth={minItemWidth}
				renderItem={renderItem}
			/>
		</div>
	)
}
