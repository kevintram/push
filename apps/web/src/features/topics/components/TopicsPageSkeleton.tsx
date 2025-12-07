import { Skeleton } from '~/components/ui/Skeleton'

export function TopicsPageSkeleton() {
	return (
		<div className='p-6 pt-2'>
			<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						className='space-y-3 rounded-lg border p-4'
						key={`skeleton-${index}`}
					>
						<Skeleton className='h-5 w-3/4' />
						<Skeleton className='h-4 w-5/6' />
						<Skeleton className='h-4 w-2/3' />
						<div className='flex justify-end'>
							<Skeleton className='h-8 w-24' />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
