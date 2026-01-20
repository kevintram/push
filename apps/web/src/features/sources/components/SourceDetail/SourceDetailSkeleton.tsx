import { Skeleton } from '~/components/ui/Skeleton'

export function SourceDetailSkeleton() {
	return (
		<div className='flex h-full flex-col'>
			{/* Header skeleton */}
			<div className='sticky top-0 z-10 w-full border-b'>
				<div className='flex items-center justify-between gap-4 px-2 py-1'>
					<div className='flex min-w-0 flex-1 items-center gap-4'>
						<Skeleton className='h-6 w-32' />
					</div>
				</div>
			</div>

			{/* Content skeleton */}
			<div className='flex min-h-0 flex-1 px-6 py-4'>
				<div className='flex w-full flex-col gap-4'>
					{/* Title skeleton */}
					<Skeleton className='h-8 w-3/4' />

					{/* Properties skeleton */}
					<div className='flex gap-2'>
						<Skeleton className='h-4 w-20' />
						<Skeleton className='h-4 w-20' />
						<Skeleton className='h-4 w-20' />
					</div>

					{/* Notes skeleton */}
					<Skeleton className='h-24 w-full' />

					{/* Children panel skeleton */}
					<div className='mt-4'>
						<Skeleton className='h-6 w-32' />
						<div className='mt-4 grid gap-4'>
							<Skeleton className='h-24 w-full' />
							<Skeleton className='h-24 w-full' />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
