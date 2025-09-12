import { Skeleton } from '~/components/ui/Skeleton'
import type { Topic } from '~/types/topics.types'
import { TopicListItem } from './TopicListItem'

export function TopicListBody({
	topics,
	isLoading
}: {
	topics: Array<Topic> | undefined
	isLoading: boolean
}) {
	if (isLoading) {
		return (
			<div className='space-y-1'>
				<div className='rounded-md py-2 pl-3' key='skeleton-1'>
					<div className='flex flex-col gap-1'>
						<div className='flex items-start justify-between gap-3'>
							<div className='min-w-0 flex-1'>
								<Skeleton className='mb-1 h-4 w-3/4' />
								<div className='mb-1 flex items-center gap-1'>
									<Skeleton className='h-3 w-8' />
									<Skeleton className='h-3 w-3' />
								</div>
								<div className='flex items-center gap-2'>
									<Skeleton className='h-1 w-12' />
									<Skeleton className='h-3 w-6' />
								</div>
							</div>
							<Skeleton className='h-6 w-6 flex-shrink-0' />
						</div>
						<div className='flex items-center justify-end gap-0.5'>
							<Skeleton className='h-6 w-6' />
							<div className='w-1' />
							<Skeleton className='h-6 w-12' />
						</div>
					</div>
				</div>
				<div className='rounded-md py-2 pl-3' key='skeleton-2'>
					<div className='flex flex-col gap-1'>
						<div className='flex items-start justify-between gap-3'>
							<div className='min-w-0 flex-1'>
								<Skeleton className='mb-1 h-4 w-2/3' />
								<div className='mb-1 flex items-center gap-1'>
									<Skeleton className='h-3 w-6' />
									<Skeleton className='h-3 w-3' />
								</div>
								<div className='flex items-center gap-2'>
									<Skeleton className='h-1 w-10' />
									<Skeleton className='h-3 w-8' />
								</div>
							</div>
							<Skeleton className='h-6 w-6 flex-shrink-0' />
						</div>
						<div className='flex items-center justify-end gap-0.5'>
							<Skeleton className='h-6 w-6' />
							<div className='w-1' />
							<Skeleton className='h-6 w-10' />
						</div>
					</div>
				</div>
				<div className='rounded-md py-2 pl-3' key='skeleton-3'>
					<div className='flex flex-col gap-1'>
						<div className='flex items-start justify-between gap-3'>
							<div className='min-w-0 flex-1'>
								<Skeleton className='mb-1 h-4 w-4/5' />
								<div className='mb-1 flex items-center gap-1'>
									<Skeleton className='h-3 w-7' />
									<Skeleton className='h-3 w-3' />
								</div>
								<div className='flex items-center gap-2'>
									<Skeleton className='h-1 w-14' />
									<Skeleton className='h-3 w-5' />
								</div>
							</div>
							<Skeleton className='h-6 w-6 flex-shrink-0' />
						</div>
						<div className='flex items-center justify-end gap-0.5'>
							<Skeleton className='h-6 w-6' />
							<div className='w-1' />
							<Skeleton className='h-6 w-11' />
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!topics || topics?.length === 0) {
		return (
			<div className='flex flex-1 items-center justify-center'>
				<div className='text-center text-muted-foreground'>
					<p>No topics found</p>
				</div>
			</div>
		)
	}

	return (
		<>
			{topics.map(topic => (
				<TopicListItem key={topic.id} topic={topic} />
			))}
		</>
	)
}
