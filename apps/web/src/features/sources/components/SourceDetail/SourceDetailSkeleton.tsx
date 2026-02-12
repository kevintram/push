import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { SidebarProvider } from '~/components/ui/sidebar'

export function SourceDetailSkeleton() {
	return (
		<SidebarProvider defaultOpen={true}>
			<div className='flex h-full min-h-0 w-full flex-col'>
				<div className='flex min-h-[70vh] w-full items-center justify-center px-6 py-4'>
					<LoadingSpinner containerClassName='h-auto w-auto py-0' />
				</div>
			</div>
		</SidebarProvider>
	)
}
