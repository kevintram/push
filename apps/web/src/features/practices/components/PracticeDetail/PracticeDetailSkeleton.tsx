import { SidebarProvider } from '~/components/ui/sidebar'
import { Skeleton } from '~/components/ui/skeleton'

export function PracticeDetailSkeleton() {
	return (
		<SidebarProvider defaultOpen={true}>
			<div className='flex h-full min-h-0 flex-col'>
				{/* Header skeleton */}
				<div className='sticky top-0 z-10 w-full border-b'>
					<div className='flex items-center justify-between gap-4 px-2 py-1'>
						<div className='flex min-w-0 flex-1 items-center gap-4'>
							<Skeleton className='h-5 w-24' />
						</div>
					</div>
				</div>
				{/* Content skeleton */}
				<div className='w-full px-6 py-4'>
					{/* Prompt skeleton */}
					<Skeleton className='h-8 w-3/4' />
					{/* Answer skeleton */}
					<Skeleton className='mt-4 h-20 w-full' />
					{/* Properties skeleton */}
					<div className='mt-4 flex gap-2'>
						<Skeleton className='h-4 w-20' />
						<Skeleton className='h-4 w-20' />
						<Skeleton className='h-4 w-20' />
					</div>
					{/* Tab bar skeleton */}
					<div className='mt-6'>
						<div className='w-full border-border border-b'>
							<div className='flex gap-0 p-0'>
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
