import { Skeleton } from '~/components/ui/Skeleton'

export function PracticeDetailSkeleton() {
	return (
		<div className='flex h-full min-h-0 flex-col'>
			{/* Header skeleton */}
			<div className='sticky top-0 z-10 w-full border-b'>
				<div className='flex items-center justify-between gap-4 px-2 py-1'>
					<Skeleton className='h-5 w-24' />
				</div>
			</div>
			{/* Content skeleton */}
			<div className='mx-auto w-full max-w-5xl px-6 py-4'>
				<div className='space-y-4'>
					<Skeleton className='h-8 w-48' />
					<Skeleton className='h-20 w-full' />
					<Skeleton className='h-20 w-full' />
				</div>
			</div>
		</div>
	)
}
