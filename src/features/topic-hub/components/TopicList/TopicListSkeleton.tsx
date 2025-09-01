import { Skeleton } from '~/components/ui/Skeleton'
import { TopicListHeader } from './TopicListHeader'

export function TopicListSkeleton() {
	return (
		<div className='flex h-full flex-col gap-4 p-4'>
			{/* Header with disabled add button */}
			<TopicListHeader onCreateTopic={() => {}} />

			{/* Topic List Skeleton */}
			<div className='flex-1 overflow-auto'>
				<div className='space-y-1'>
					{Array.from({ length: 6 }).map((_, i) => (
						<TopicListItemSkeleton
							hasChildren={i % 3 === 0}
							key={i}
							level={0}
						/>
					))}
				</div>
			</div>
		</div>
	)
}

function TopicListItemSkeleton({
	hasChildren,
	level
}: {
	hasChildren: boolean
	level: number
}) {
	return (
		<div className='space-y-0.5'>
			<div className='rounded-md py-2 pl-3'>
				<div className='group flex flex-col gap-1'>
					{/* Topic content skeleton */}
					<div className='flex flex-col gap-1'>
						<div className='flex items-start justify-between gap-3'>
							<div className='min-w-0 flex-1'>
								{/* Topic name */}
								<Skeleton className='mb-1 h-4 w-3/4' />

								{/* Retrievability and last reviewed */}
								<div className='mb-1 flex items-center gap-1'>
									<Skeleton className='h-3 w-8' />
									<Skeleton className='h-3 w-3' />
								</div>

								{/* Stability progress bar */}
								<div className='flex items-center gap-2'>
									<Skeleton className='h-1 w-12' />
									<Skeleton className='h-3 w-6' />
								</div>
							</div>

							{/* More options button */}
							<Skeleton className='h-6 w-6 flex-shrink-0' />
						</div>
					</div>

					{/* Parent and Children Buttons */}
					<div className='flex items-center justify-end gap-0.5'>
						{/* Parents Button */}
						<Skeleton className='h-6 w-6' />
						<div className='w-1' />
						{/* Children Button */}
						<Skeleton className='h-6 w-12' />
					</div>
				</div>
			</div>

			{/* Nested children skeleton */}
			{hasChildren && level < 2 && (
				<div className='relative ml-4'>
					<div
						className='absolute bg-muted-foreground/30'
						style={{
							top: '0px',
							width: '1px',
							height: '100%'
						}}
					/>
					{Array.from({ length: 2 }).map((_, i) => (
						<TopicListItemSkeleton
							hasChildren={i === 0 && level < 1}
							key={i}
							level={level + 1}
						/>
					))}
				</div>
			)}
		</div>
	)
}
