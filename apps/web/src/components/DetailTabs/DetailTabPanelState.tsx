import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'

interface DetailTabPanelStateProps {
	isLoading: boolean
	isError: boolean
	isEmpty: boolean
	error?: unknown
	onRetry?: () => void
	emptyMessage: string
	isRefreshing?: boolean
	children: ReactNode
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message
	}
	return 'Failed to load this tab. Please try again.'
}

export function DetailTabPanelState({
	isLoading,
	isError,
	isEmpty,
	error,
	onRetry,
	emptyMessage,
	isRefreshing = false,
	children
}: DetailTabPanelStateProps) {
	if (isLoading) {
		return (
			<div className='space-y-3 py-2'>
				<Skeleton className='h-24 w-full' />
				<Skeleton className='h-24 w-full' />
				<Skeleton className='h-24 w-full' />
			</div>
		)
	}

	if (isError) {
		return (
			<div className='flex flex-col items-center gap-3 py-6 text-center'>
				<p className='text-muted-foreground text-sm'>
					{getErrorMessage(error)}
				</p>
				{onRetry ? (
					<Button onClick={onRetry} size='sm' type='button' variant='outline'>
						Retry
					</Button>
				) : null}
			</div>
		)
	}

	if (isEmpty) {
		return <p className='py-2 text-muted-foreground text-sm'>{emptyMessage}</p>
	}

	return (
		<div className='relative'>
			{isRefreshing ? (
				<div className='absolute top-0 right-0 z-10 flex items-center gap-1 text-muted-foreground text-xs'>
					<Loader2 className='h-3.5 w-3.5 animate-spin' />
					<span>Refreshing</span>
				</div>
			) : null}
			{children}
		</div>
	)
}
