import { Card, CardContent } from '~/components/ui/Card'
import { Separator } from '~/components/ui/Separator'
import { Skeleton } from '~/components/ui/Skeleton'

export function TopicPageSkeleton() {
	return (
		<div>
			<div className='flex w-full flex-1 flex-col gap-4 overflow-auto p-3 sm:gap-6 sm:p-4 md:p-6'>
				{/* TopicHeader Skeleton */}
				<div className='flex w-full flex-col gap-3 sm:gap-4'>
					<div className='flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start'>
						<div className='flex flex-1 flex-col gap-2'>
							<div className='flex flex-col gap-2'>
								<div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-0'>
									{/* Title skeleton */}
									<div className='flex-1'>
										<Skeleton className='h-8 w-3/4 sm:h-10 md:h-12' />
									</div>

									{/* Populate button skeleton (desktop) */}
									<div className='hidden flex-shrink-0 sm:mt-0.5 sm:block'>
										<Skeleton className='h-8 w-24' />
									</div>
								</div>

								{/* Stats row */}
								<div className='flex flex-col gap-2 sm:flex-row sm:gap-2'>
									{/* Retrievability */}
									<div className='flex flex-shrink-0 items-center gap-2'>
										<Skeleton className='h-4 w-4' />
										<Skeleton className='h-4 w-20' />
									</div>

									<span className='hidden font-bold sm:inline'> · </span>

									{/* Last Reviewed */}
									<div className='flex flex-shrink-0 items-center gap-2'>
										<Skeleton className='h-4 w-4' />
										<Skeleton className='h-4 w-32' />
									</div>

									<span className='hidden font-bold sm:inline'> · </span>

									{/* Stability */}
									<div className='flex flex-shrink-0 items-center gap-2'>
										<Skeleton className='h-1.5 w-8' />
										<Skeleton className='h-4 w-24' />
									</div>

									<span className='hidden font-bold sm:inline'> · </span>

									{/* Born text */}
									<div className='flex flex-shrink-0 items-center gap-2'>
										<Skeleton className='h-4 w-4' />
										<Skeleton className='h-4 w-28' />
									</div>
								</div>

								{/* Populate button skeleton (mobile) */}
								<div className='sm:hidden'>
									<Skeleton className='h-8 w-full' />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* TopicFamilyPanel Skeleton */}
				<Card className='w-full px-3 shadow-sm'>
					<div className='space-y-4'>
						{/* Parents */}
						<div className='flex flex-wrap items-center gap-2'>
							<div className='flex items-center gap-2'>
								<Skeleton className='h-4 w-4' />
								<Skeleton className='h-4 w-12' />
							</div>
							<Skeleton className='h-6 w-16' />
							<Skeleton className='h-6 w-20' />
							<Skeleton className='h-6 w-6' />
						</div>

						<Separator />

						{/* Children */}
						<div className='flex flex-wrap items-center gap-2'>
							<div className='flex items-center gap-2'>
								<Skeleton className='h-4 w-4' />
								<Skeleton className='h-4 w-16' />
							</div>
							<Skeleton className='h-6 w-20' />
							<Skeleton className='h-6 w-18' />
							<Skeleton className='h-6 w-24' />
							<Skeleton className='h-6 w-6' />
						</div>
					</div>
				</Card>

				{/* Notes Skeleton */}
				<Card className='w-full flex-1'>
					<CardContent className='min-h-0 flex-1 p-6'>
						{/* Content area skeleton */}
						<div className='space-y-3'>
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-5/6' />
							<Skeleton className='h-4 w-4/5' />
							<Skeleton className='h-20 w-full' />
						</div>
					</CardContent>
				</Card>

				{/* Timeline Skeleton */}
				<div className='flex h-full flex-col gap-3 p-4'>
					<div className='flex items-center justify-between gap-2 border-b pb-2'>
						<Skeleton className='h-5 w-16' />
						<Skeleton className='h-8 w-8' />
					</div>

					<div className='flex min-h-0 flex-1 flex-col'>
						<div className='flex-1 space-y-2 overflow-auto'>
							{/* Timeline entries skeleton */}
							{Array.from({ length: 3 }).map((_, i) => (
								<div className='space-y-2' key={i}>
									<div className='flex items-center gap-2'>
										<Skeleton className='h-3 w-3 rounded-full' />
										<Skeleton className='h-4 w-24' />
									</div>
									<div className='ml-5 space-y-1'>
										<Skeleton className='h-4 w-full' />
										<Skeleton className='h-4 w-3/4' />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
