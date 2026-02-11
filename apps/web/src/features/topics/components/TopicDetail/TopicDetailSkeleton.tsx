import { SidebarProvider } from '~/components/ui/sidebar'
import { Skeleton } from '~/components/ui/skeleton'

export function TopicDetailSkeleton() {
	return (
		<SidebarProvider defaultOpen={true}>
			<div className='flex h-full min-h-0 flex-col'>
				<div className='sticky top-0 z-10 w-full border-b'>
					<div className='flex items-center justify-between gap-4 px-2 py-1'>
						<div className='flex min-w-0 flex-1 items-center gap-4'>
							<Skeleton className='h-6 w-32' />
						</div>
						<div className='flex items-center gap-2'>
							<Skeleton className='h-6 w-6' />
							<Skeleton className='h-6 w-6' />
						</div>
					</div>
				</div>
				<div className='w-full px-6 py-4'>
					{/* Title skeleton */}
					<Skeleton className='h-8 w-3/4' />
					{/* Properties + notes skeleton */}
					<div className='mt-2 flex flex-col gap-1'>
						<div className='flex gap-2'>
							<Skeleton className='h-4 w-20' />
							<Skeleton className='h-4 w-20' />
							<Skeleton className='h-4 w-20' />
						</div>
						<Skeleton className='h-12 w-full' />
					</div>
					{/* Tab bar skeleton */}
					<div className='mt-6'>
						<div className='w-full border-border border-b'>
							<div className='flex gap-0 p-0'>
								<Skeleton className='h-10 w-20 rounded-none' />
								<Skeleton className='h-10 w-20 rounded-none' />
								<Skeleton className='h-10 w-20 rounded-none' />
								<Skeleton className='h-10 w-20 rounded-none' />
							</div>
						</div>
						{/* Tab content skeleton */}
						<div className='mt-4 grid gap-4'>
							<Skeleton className='h-24 w-full' />
							<Skeleton className='h-24 w-full' />
						</div>
					</div>
				</div>
			</div>
		</SidebarProvider>
	)
}
