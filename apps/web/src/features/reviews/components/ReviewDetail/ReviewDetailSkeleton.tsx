import { Skeleton } from '~/components/ui/Skeleton'

export function ReviewDetailSkeleton() {
	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<div className='sticky top-0 z-10 w-full border-b'>
				{/* Header skeleton */}
				<div className='flex items-center justify-between gap-4 px-2 py-1'>
					<div className='flex min-w-0 flex-1 items-center gap-4'>
						{/* Date button skeleton */}
						<Skeleton className='h-8 w-24' />
					</div>

					<div className='flex items-center gap-2'>
						{/* More options button skeleton */}
						<Skeleton className='h-6 w-6' />
					</div>
				</div>
			</div>

			<div className='scrollbar-track-transparent flex flex-1 gap-4 overflow-y-auto p-4'>
				{/* Checkbox skeleton */}
				<Skeleton className='mt-0.5 h-4 w-4 shrink-0' />

				<div className='flex-1'>
					{/* Description skeleton */}
					<div className='space-y-2 pb-4'>
						<Skeleton className='h-4 w-full' />
						<Skeleton className='h-4 w-4/5' />
						<Skeleton className='h-4 w-3/4' />
					</div>

					{/* Topics panel skeleton */}
					<div className='w-full flex-1 space-y-4'>
						{/* Topics header */}
						<div className='flex items-center justify-between'>
							<Skeleton className='h-5 w-16' />
							<Skeleton className='h-8 w-8 rounded-full' />
						</div>

						{/* Topic badges skeleton */}
						<div className='flex flex-wrap gap-2'>
							<Skeleton className='h-6 w-20 rounded-full' />
							<Skeleton className='h-6 w-24 rounded-full' />
							<Skeleton className='h-6 w-16 rounded-full' />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
