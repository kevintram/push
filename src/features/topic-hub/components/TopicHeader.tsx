import {
	ArchiveRestore,
	Baby,
	ChevronDown,
	RotateCcw,
	Sprout,
	Star,
	User,
	UserPlus,
	Users
} from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Progress } from '~/components/ui/Progress'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { cn } from '~/lib/utils'
import type { Topic } from '~/types/topics.types'
import { getRetrievabilityColorClass } from '../utils/getRetrievabilityColor'
import { numDaysElapsedFrom } from '../utils/numDaysElapsedFrom'

export function TopicHeader({ topic }: { topic: Topic }) {
	console.log('inside topic header!')
	console.log('topic: ', topic)

	const sinceLastReview = useMemo(
		() => numDaysElapsedFrom(topic.created),
		[topic.created]
	)

	return (
		<div className='flex w-full flex-col gap-3 sm:gap-4'>
			<div className='flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start'>
				<div className='flex flex-1 flex-col gap-2'>
					<div className='flex flex-col gap-2'>
						{/* Title and populate button row (desktop) */}
						<div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-0'>
							<h1 className='font-bold text-xl leading-tight sm:flex-1 sm:pr-4 sm:text-2xl md:text-3xl'>
								{topic.title}
							</h1>
							<div className='hidden flex-shrink-0 sm:mt-0.5 sm:block'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild={true}>
										<Button size='sm' variant='secondary'>
											<Baby className='h-4 w-4' />
											<span className='ml-1'>Populate</span>
											<ChevronDown className='ml-1 h-4 w-4' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem>
											<Users className='h-4 w-4' />
											Children
										</DropdownMenuItem>
										<DropdownMenuItem>
											<UserPlus className='h-4 w-4' />
											Grandchildren
										</DropdownMenuItem>
										<DropdownMenuItem>
											<Star className='h-4 w-4' />
											All Descendants
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						<div className='flex flex-col gap-2 sm:flex-row sm:gap-2'>
							{/* Retrievability */}
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<div className='flex flex-shrink-0 cursor-help items-center gap-2'>
										<ArchiveRestore className='h-3 w-3 sm:h-4 sm:w-4' />
										<p className='whitespace-nowrap font-medium text-muted-foreground text-xs sm:text-sm'>
											<span
												className={cn(
													getRetrievabilityColorClass(
														topic?.retrievability
													)
												)}
											>
												{topic.retrievability}%
											</span>{' '}
											retrievability
										</p>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>Retrievability</p>
								</TooltipContent>
							</Tooltip>

							<span className='hidden font-bold sm:inline'> · </span>

							{/* Last Reviewed */}
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<div className='flex flex-shrink-0 cursor-help items-center gap-2'>
										<RotateCcw className='h-3 w-3 sm:h-4 sm:w-4' />
										<span className='whitespace-nowrap font-medium text-muted-foreground text-xs sm:text-sm'>
											Last reviewed {sinceLastReview} days ago
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>Last Reviewed</p>
								</TooltipContent>
							</Tooltip>

							<span className='hidden font-bold sm:inline'> · </span>

							{/* Stability */}
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<div className='flex flex-shrink-0 cursor-help items-center gap-2'>
										<Progress
											className='h-1.5 w-8'
											max={365}
											value={topic.stability}
										/>
										<span className='whitespace-nowrap font-medium text-muted-foreground text-xs sm:text-sm'>
											Stable for {topic.stability} days
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>Stability ({topic.stability}/365 days)</p>
								</TooltipContent>
							</Tooltip>

							<span className='hidden font-bold sm:inline'> · </span>

							{/* Born text */}
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<div className='flex flex-shrink-0 cursor-help items-center gap-2'>
										<Sprout className='h-3 w-3 sm:h-4 sm:w-4' />
										<span className='whitespace-nowrap font-medium text-muted-foreground text-xs sm:text-sm'>
											Born {sinceLastReview} days ago
										</span>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>When added</p>
								</TooltipContent>
							</Tooltip>
						</div>

						{/* Populate button (mobile) */}
						<div className='sm:hidden'>
							<DropdownMenu>
								<DropdownMenuTrigger asChild={true}>
									<Button className='w-full' size='sm' variant='secondary'>
										<Baby className='h-4 w-4' />
										<span className='ml-2'>Populate</span>
										<ChevronDown className='ml-1 h-4 w-4' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuItem>
										<User className='h-4 w-4' />
										Self
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Users className='h-4 w-4' />
										Children
									</DropdownMenuItem>
									<DropdownMenuItem>
										<UserPlus className='h-4 w-4' />
										Grandchildren
									</DropdownMenuItem>
									<DropdownMenuItem>
										<Star className='h-4 w-4' />
										All Descendants
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
