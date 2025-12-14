import { PageLayout } from '~/app/layouts/PageLayout'
import { Skeleton } from '~/components/ui/Skeleton'

function ReviewItemSkeleton() {
	return (
		<div className='group rounded-lg px-4'>
			<div className='flex flex-col'>
				{/* Row 1: Checkbox + Description + Date + More Button */}
				<div className='flex items-start gap-4'>
					{/* Checkbox skeleton */}
					<Skeleton className='mt-2 h-4 w-4' />

					{/* Description skeleton */}
					<div className='mt-1 flex-1'>
						<Skeleton className='h-6 w-full max-w-md' />
					</div>

					{/* Date and More Actions skeleton */}
					<div className='flex items-center gap-0'>
						<Skeleton className='h-6 w-24' />
						<Skeleton className='h-6 w-6' />
					</div>
				</div>

				{/* Row 2: Spacer + Topics skeleton */}
				<div className='mt-2 flex items-center gap-2'>
					<div className='w-6' />
					<div className='flex gap-1'>
						<Skeleton className='h-5 w-16 rounded-full' />
						<Skeleton className='h-5 w-20 rounded-full' />
					</div>
				</div>
			</div>
		</div>
	)
}

function TopicCardSkeleton() {
	return (
		<div className='rounded-lg border p-3'>
			<div className='flex flex-col gap-2'>
				{/* Topic name */}
				<Skeleton className='h-5 w-32' />
				{/* Topic notes */}
				<Skeleton className='h-4 w-full' />
				<Skeleton className='h-4 w-3/4' />
			</div>
		</div>
	)
}

function SectionSkeleton() {
	return (
		<div className='mb-2'>
			{/* Section header with title and chevron */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Skeleton className='h-6 w-32' />
					<Skeleton className='h-5 w-5' />
				</div>
			</div>

			{/* Single column content with left border */}
			<div className='mt-2 mb-10 ml-5 flex flex-col gap-4 border-border border-l-2 pl-2'>
				{/* Reviews Subsection */}
				<div className='flex flex-col'>
					<div className='flex items-center gap-2'>
						<Skeleton className='h-5 w-28' />
						<Skeleton className='h-4 w-4' />
					</div>
					<div className='px-4'>
						<ReviewItemSkeleton />
						<ReviewItemSkeleton />
						<ReviewItemSkeleton />
					</div>
				</div>

				{/* Topics Subsection */}
				<div className='flex flex-col'>
					<div className='flex items-center gap-2'>
						<Skeleton className='h-5 w-24' />
						<Skeleton className='h-4 w-4' />
					</div>
					<div
						className='grid gap-4 p-4 pb-0'
						style={{
							gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))'
						}}
					>
						<TopicCardSkeleton />
						<TopicCardSkeleton />
						<TopicCardSkeleton />
					</div>
				</div>
			</div>
		</div>
	)
}

export function ReviewListSkeleton() {
	return (
		<PageLayout.Content>
			<SectionSkeleton />
			<SectionSkeleton />
		</PageLayout.Content>
	)
}
