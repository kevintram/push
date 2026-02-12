import { LoadingSpinner } from '~/components/ui/loading-spinner'

interface MasonryLayoutSkeletonProps {
	count?: number
	gap?: number
	minItemWidth?: number
}

export function MasonryLayoutSkeleton(props: MasonryLayoutSkeletonProps) {
	const minHeightClass =
		props.count !== undefined && props.count <= 20 ? 'min-h-40' : 'min-h-64'

	return <LoadingSpinner containerClassName={minHeightClass} />
}
