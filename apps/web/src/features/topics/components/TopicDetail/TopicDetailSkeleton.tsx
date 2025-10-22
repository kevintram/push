import { SidebarProvider } from '~/components/ui/Sidebar'
import { Skeleton } from '~/components/ui/Skeleton'

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
				<div className='min-h-0 flex-1 px-6 py-4'>
					<div className='pb-4'>
						<Skeleton className='mb-1 h-12 w-full max-w-xl' />
						<Skeleton className='h-24 w-full max-w-2xl' />
					</div>
				</div>
			</div>
		</SidebarProvider>
	)
}
