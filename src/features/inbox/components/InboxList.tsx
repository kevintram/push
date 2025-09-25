import { Skeleton } from '~/components/ui/Skeleton'
import type { Tables } from '~/types/database.types'
import { InboxItem } from './InboxItem'

export function InboxList({
	topics,
	isLoading
}: {
	topics: Array<Tables<'topics'>> | undefined | null
	isLoading: boolean
}) {
	if (isLoading) {
		return (
			<div className='space-y-3'>
				{Array.from({ length: 3 }).map((_, index) => (
					<div className='rounded-lg border p-4' key={`skeleton-${index}`}>
						<div className='space-y-2'>
							<Skeleton className='h-5 w-3/4' />
							<Skeleton className='h-4 w-1/2' />
							<div className='flex justify-end'>
								<Skeleton className='h-8 w-20' />
							</div>
						</div>
					</div>
				))}
			</div>
		)
	}

	if (!topics || topics?.length === 0) {
		return (
			<div className='flex flex-1 items-center justify-center py-12'>
				<div className='text-center text-muted-foreground'>
					<p className='font-medium text-lg'>Your inbox is empty</p>
					<p className='text-sm'>Create your first quick entry topic above</p>
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-3'>
			{topics.map(topic => (
				<InboxItem key={topic.id} topic={topic} />
			))}
		</div>
	)
}
