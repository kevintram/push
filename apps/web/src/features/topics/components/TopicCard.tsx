import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
	Archive,
	ArchiveRestore,
	Baby,
	BicepsFlexed,
	Calendar,
	ChevronDown,
	GitPullRequestClosed,
	Inbox,
	MoreHorizontal,
	Mountain,
	Trash2,
	User2
} from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { updateReview as updateReviewApi } from '~/features/reviews/api/updateReview'
import type { Rating, Todo, Topic } from '~/models/todo-topic.types'
import { getRatingIcon } from '~/utils/getRatingIcon'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { deleteTopic as deleteTopicApi } from '../api/deleteTopic'
import { updateTopic as updateTopicApi } from '../api/updateTopic'

const MIN_HEIGHT = 96

function roundToTwoDecimals(num: number): number {
	return Math.round(num * 100) / 100
}

interface TopicCardProps {
	topic: Topic
	onTopicClick?: (topic: Topic) => void
	onRemoveRelationship?: () => void
	removeRelationshipText?: string
	minHeight?: number
	searchQuery?: string
	todos?: Array<Todo>
	rating?: Rating | null
	reviewId?: number
}

export function TopicCard({
	topic,
	onTopicClick,
	onRemoveRelationship,
	removeRelationshipText = 'Remove as Child',
	minHeight = MIN_HEIGHT,
	searchQuery, // for topic card in search dialog to support highlighting and shit
	rating,
	reviewId
}: TopicCardProps) {
	const queryClient = useQueryClient()

	const { mutateAsync: deleteTopicMutation } = useMutation({
		mutationFn: deleteTopicApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['topics'] })
		}
	})

	const { mutateAsync: updateTopicMutation } = useMutation({
		mutationFn: updateTopicApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['topics'] })
		}
	})

	const { mutateAsync: updateReviewMutation } = useMutation({
		mutationFn: ({ reviewId, rating }: { reviewId: number; rating: Rating }) =>
			updateReviewApi(reviewId, rating),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const parentCount = topic.parents?.length ?? 0
	const childCount = topic.children?.length ?? 0

	// Calculate the due date display
	const dueDateDisplay = useMemo(() => {
		if (!topic.due) return null

		const now = dayjs().startOf('day')
		const dueDayjs = dayjs(topic.due).startOf('day')
		const diffDays = dueDayjs.diff(now, 'day')
		const isUpcoming = dueDayjs.isAfter(now)

		let displayText: string
		if (diffDays === 0) {
			displayText = 'Today'
		} else if (diffDays === 1) {
			displayText = 'Tomorrow'
		} else if (diffDays === -1) {
			displayText = 'Yesterday'
		} else if (isUpcoming) {
			displayText = `in ${diffDays}d`
		} else {
			displayText = `${Math.abs(diffDays)}d ago`
		}

		return {
			dueDate: topic.due,
			isUpcoming,
			displayText
		}
	}, [topic.due])

	const handleActivate = useCallback(() => {
		onTopicClick?.(topic)
	}, [onTopicClick, topic])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onTopicClick?.(topic)
			}
		},
		[onTopicClick, topic]
	)

	const handleDeleteTopic = () => {
		deleteTopicMutation(topic.id)
	}

	const handleArchiveToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation({
				id: topic.id,
				archived: !topic.archived
			})
		},
		[updateTopicMutation, topic.id, topic.archived]
	)

	const handleInboxToggle = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation()
			await updateTopicMutation({
				id: topic.id,
				inboxed: !topic.inboxed
			})
		},
		[updateTopicMutation, topic.id, topic.inboxed]
	)

	const handleRatingChange = useCallback(
		async (newRating: Rating) => {
			if (!reviewId) return
			await updateReviewMutation({ reviewId, rating: newRating })
		},
		[reviewId, updateReviewMutation]
	)

	return (
		<Card
			className='group relative cursor-pointer p-0 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			role='button'
			tabIndex={0}
		>
			<CardContent
				className='flex h-full flex-col justify-between gap-3 px-3 py-3'
				style={{ minHeight: `${minHeight}px` }}
			>
				<div className='flex flex-col gap-2.5'>
					{/* Top row: Parent count and menu */}
					<div className='flex items-center justify-between'>
						{/* Parents count - top left */}
						<Popover>
							<PopoverTrigger asChild={true}>
								<div
									className='flex cursor-pointer items-center gap-1 text-muted-foreground text-xs hover:text-foreground'
									onClick={e => e.stopPropagation()}
								>
									<User2 className='h-3 w-3' />
									<span>{parentCount}</span>
								</div>
							</PopoverTrigger>
							<PopoverContent
								align='start'
								className='w-64 p-3'
								onClick={e => e.stopPropagation()}
								onKeyDown={e => e.stopPropagation()}
								side='top'
							>
								<div className='flex flex-col gap-2'>
									<h4 className='font-semibold text-sm'>Parent Topics</h4>
									{parentCount === 0 ? (
										<p className='text-muted-foreground text-xs'>No parents</p>
									) : (
										<ul className='flex flex-col gap-1.5'>
											{(topic.parents ?? []).map(parent => (
												<li
													className='break-words text-sm leading-tight '
													key={parent.id}
												>
													{parent.name || parent.notes || 'Untitled'}
												</li>
											))}
										</ul>
									)}
								</div>
							</PopoverContent>
						</Popover>

						{/* Rating and Menu - top right */}
						<div className='flex items-center gap-1'>
							{rating && reviewId && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild={true}>
										<Button
											className='h-5 gap-1 px-1.5 text-xs capitalize'
											onClick={e => e.stopPropagation()}
											size='sm'
											variant='outline'
										>
											{getRatingIcon(rating)}
											{rating}
											<ChevronDown className='h-3 w-3' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='start'
										side='bottom'
										sideOffset={2}
									>
										<DropdownMenuItem
											onClick={e => {
												e.stopPropagation()
												handleRatingChange('miss')
											}}
										>
											{getRatingIcon('miss')}
											<span className='ml-2 capitalize'>Miss</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={e => {
												e.stopPropagation()
												handleRatingChange('hard')
											}}
										>
											{getRatingIcon('hard')}
											<span className='ml-2 capitalize'>Hard</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={e => {
												e.stopPropagation()
												handleRatingChange('good')
											}}
										>
											{getRatingIcon('good')}
											<span className='ml-2 capitalize'>Good</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={e => {
												e.stopPropagation()
												handleRatingChange('easy')
											}}
										>
											{getRatingIcon('easy')}
											<span className='ml-2 capitalize'>Easy</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
							{rating && !reviewId && (
								<Button
									className='h-5 gap-1 px-1.5 text-xs capitalize'
									onClick={e => e.stopPropagation()}
									size='sm'
									variant='outline'
								>
									{getRatingIcon(rating)}
									{rating}
								</Button>
							)}
							<DropdownMenu>
								<DropdownMenuTrigger asChild={true}>
									<Button
										className='h-5 w-5 p-0'
										onClick={e => e.stopPropagation()}
										variant='ghost'
									>
										<MoreHorizontal className='h-3 w-3' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
									<DropdownMenuItem onClick={handleInboxToggle}>
										{topic.inboxed ? (
											<>
												<Inbox className='mr-2 h-4 w-4' />
												Remove from Inbox
											</>
										) : (
											<>
												<Inbox className='mr-2 h-4 w-4' />
												Add to Inbox
											</>
										)}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={handleArchiveToggle}>
										{topic.archived ? (
											<>
												<ArchiveRestore className='mr-2 h-4 w-4' />
												Unarchive
											</>
										) : (
											<>
												<Archive className='mr-2 h-4 w-4' />
												Archive
											</>
										)}
									</DropdownMenuItem>
									{onRemoveRelationship && (
										<DropdownMenuItem
											onClick={e => {
												e.stopPropagation()
												onRemoveRelationship()
											}}
										>
											<GitPullRequestClosed className='mr-2 h-4 w-4' />
											{removeRelationshipText}
										</DropdownMenuItem>
									)}
									<DropdownMenuItem
										onClick={e => {
											e.stopPropagation()
											handleDeleteTopic()
										}}
										variant='destructive'
									>
										<Trash2 className='mr-2 h-4 w-4' />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					<div className='flex flex-col gap-1'>
						{/* Inbox/Archive indicators */}
						{(topic.inboxed || topic.archived) && (
							<div className='flex items-center gap-2 text-muted-foreground text-xs'>
								{topic.inboxed && (
									<div className='flex items-center gap-1'>
										<Inbox className='h-3 w-3' />
										<span>Inbox</span>
									</div>
								)}
								{topic.archived && (
									<div className='flex items-center gap-1'>
										<Archive className='h-3 w-3' />
										<span>Archived</span>
									</div>
								)}
							</div>
						)}

						{/* The Actual Content */}
						<div className='flex flex-col gap-0.5'>
							{topic.name && (
								<h3 className='break-word font-semibold leading-tight [overflow-wrap:anywhere]'>
									{searchQuery
										? highlightText({ text: topic.name, query: searchQuery })
										: topic.name}
								</h3>
							)}
							{topic.notes && (
								<p className='break-word text-sm [overflow-wrap:anywhere]'>
									{searchQuery
										? truncateWithHighlight(topic.notes, searchQuery, 150)
										: topic.notes}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Bottom row: Review date and children count */}
				<div className='flex items-center gap-1 text-muted-foreground text-xs'>
					{/* Due date - bottom left */}
					{dueDateDisplay ? (
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<div className='flex items-center gap-1'>
									<Calendar
										className={`h-3 w-3 ${
											dueDateDisplay.displayText === 'Today'
												? 'text-blue-600 dark:text-blue-400'
												: dueDateDisplay.displayText === 'Yesterday' ||
														dueDateDisplay.displayText.includes('ago')
													? 'text-red-600 dark:text-red-400'
													: ''
										}`}
									/>
									<span
										className={
											dueDateDisplay.displayText === 'Today'
												? 'text-blue-600 dark:text-blue-400'
												: dueDateDisplay.displayText === 'Yesterday' ||
														dueDateDisplay.displayText.includes('ago')
													? 'text-red-600 dark:text-red-400'
													: ''
										}
									>
										{dueDateDisplay.displayText}
									</span>
								</div>
							</TooltipTrigger>
							<TooltipContent side='bottom'>
								Due on {dayjs(dueDateDisplay.dueDate).format('MMMM D, YYYY')}
							</TooltipContent>
						</Tooltip>
					) : (
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<div className='flex items-center gap-1'>
									<Calendar className='h-3 w-3' />
									<span>None</span>
								</div>
							</TooltipTrigger>
							<TooltipContent side='bottom'>No due date</TooltipContent>
						</Tooltip>
					)}
					&nbsp;·&nbsp;
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<BicepsFlexed className='h-3 w-3' />
								<span>
									{topic.stability != null
										? `${Math.round(topic.stability)}d`
										: 'No data'}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>
							{topic.stability != null
								? `Stable for ${Math.round(topic.stability)} days`
								: 'Stability not yet calculated'}
						</TooltipContent>
					</Tooltip>
					&nbsp;·&nbsp;
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<Mountain className='h-3 w-3' />
								<span>
									{topic.difficulty != null
										? `${roundToTwoDecimals(topic.difficulty)}/10`
										: 'No data'}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>
							{topic.difficulty != null
								? `${roundToTwoDecimals(topic.difficulty)}/10 difficulty`
								: 'Difficulty not yet calculated'}
						</TooltipContent>
					</Tooltip>
					<div className='flex-1' />
					{/* Children count - bottom right */}
					<Popover>
						<PopoverTrigger asChild={true}>
							<div
								className='flex cursor-pointer items-center gap-1 hover:text-foreground'
								onClick={e => e.stopPropagation()}
							>
								<Baby className='h-3 w-3' />
								<span>{childCount}</span>
							</div>
						</PopoverTrigger>
						<PopoverContent
							align='end'
							className='w-64 p-3'
							onClick={e => e.stopPropagation()}
							onKeyDown={e => e.stopPropagation()}
							side='bottom'
						>
							<div className='flex flex-col gap-2'>
								<h4 className='font-semibold text-sm'>Child Topics</h4>
								{childCount === 0 ? (
									<p className='text-muted-foreground text-xs'>No children</p>
								) : (
									<ul className='flex flex-col gap-1.5'>
										{(topic.children ?? []).map(child => (
											<li
												className='break-words text-sm leading-tight'
												key={child.id}
											>
												{child.name || child.notes || 'Untitled'}
											</li>
										))}
									</ul>
								)}
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</CardContent>
		</Card>
	)
}
