import { PageLayout } from '~/app/layouts/PageLayout'
import { Skeleton } from '~/components/ui/skeleton'

function ReviewItemSkeleton() {
	return (
		<div className='rounded-md py-2'>
			<div className='flex flex-col'>
				{/* Row 1: Checkbox + Description + Date + More Button */}
				<div className='flex items-center pb-1'>
					<Skeleton className='h-4 w-4 rounded-sm' />
					<Skeleton className='ml-2 h-4 w-full max-w-md' />
					<Skeleton className='ml-2 h-6 w-24' />
					<Skeleton className='ml-1 h-6 w-6' />
				</div>

				{/* Row 2: Topic link + stability info */}
				<div className='flex items-center justify-end gap-2'>
					<Skeleton className='h-4 w-28' />
					<Skeleton className='h-4 w-16' />
				</div>
			</div>
		</div>
	)
}

function SectionSkeleton({ itemCount = 3 }: { itemCount?: number }) {
	return (
		<div className='mb-2'>
			{/* Section header: label + count badge + chevron */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Skeleton className='h-7 w-32' />
					<Skeleton className='h-5 w-6 rounded-full' />
					<Skeleton className='h-5 w-5' />
				</div>
			</div>

			{/* Left-bordered content with review items */}
			<div className='mt-2 mb-10 ml-5 border-border border-l-2 pl-2'>
				<div className='px-4'>
					{Array.from({ length: itemCount }, (_, i) => (
						<ReviewItemSkeleton key={i} />
					))}
				</div>
			</div>
		</div>
	)
}

export function ReviewListSkeleton() {
	return (
		<PageLayout.Content>
			<SectionSkeleton itemCount={3} />
			<SectionSkeleton itemCount={2} />
		</PageLayout.Content>
	)
}
