import { Skeleton } from '~/components/ui/Skeleton'

function TodoItemSkeleton() {
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

function SectionSkeleton() {
	return (
		<div className='mb-4'>
			{/* Section header */}
			<div className='sticky top-[82px] z-[5] flex items-center justify-between bg-primary-foreground py-2'>
				<Skeleton className='h-6 w-32' />
				<Skeleton className='mr-4 h-8 w-8 rounded' />
			</div>

			{/* Section items */}
			<div className='space-y-4'>
				<TodoItemSkeleton />
				<TodoItemSkeleton />
				<TodoItemSkeleton />
			</div>
		</div>
	)
}

export function TodosPageSkeleton() {
	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				{/* Header */}
				<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
					<div className='flex items-center justify-between'>
						<Skeleton className='h-8 w-24' />
					</div>
					{/* Filter badges */}
					<div className='top-0 z-10 pt-2 pb-1'>
						<div className='flex flex-wrap items-center gap-2'>
							<Skeleton className='h-6 w-16 rounded-full' />
							<Skeleton className='h-6 w-20 rounded-full' />
							<Skeleton className='h-6 w-24 rounded-full' />
							<Skeleton className='h-6 w-28 rounded-full' />
							<Skeleton className='h-6 w-20 rounded-full' />
						</div>
					</div>
				</div>

				{/* Sections */}
				<div className='px-6'>
					<SectionSkeleton />
					<SectionSkeleton />
				</div>
			</div>
		</div>
	)
}
