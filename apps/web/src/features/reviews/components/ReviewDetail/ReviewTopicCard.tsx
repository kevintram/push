import dayjs from 'dayjs'
import {
	Calendar,
	ChevronDown,
	GitPullRequestClosed,
	MoreHorizontal
} from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useUpdateTopicReview } from '~/features/reviews/api/updateTopicReview'
import type { Rating, Topic } from '~/models/review-topic.types'
import { getRatingIcon } from '~/utils/getRatingIcon'

interface ReviewTopicCardProps {
	topic: Topic
	rating?: Rating | null
	topicReviewId: number
	onTopicClick?: (topic: Topic) => void
	onRemoveFromReview?: (topicReviewId: number) => void
	minHeight?: number
}

export function ReviewTopicCard({
	topic,
	rating,
	topicReviewId,
	onTopicClick,
	onRemoveFromReview,
	minHeight = 72
}: ReviewTopicCardProps) {
	const updateReviewMutation = useUpdateTopicReview()

	const handleRatingChange = useCallback(
		async (newRating: Rating) => {
			if (!topicReviewId) return
			await updateReviewMutation.mutateAsync({
				id: topicReviewId,
				rating: newRating
			})
		},
		[topicReviewId, updateReviewMutation]
	)

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

	const handleRemoveFromReview = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation()
			onRemoveFromReview?.(topicReviewId)
		},
		[onRemoveFromReview, topicReviewId]
	)

	// Due date formatting
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

	const dueDateColorClass = (() => {
		if (dueDateDisplay?.displayText === 'Today') {
			return 'text-blue-600 dark:text-blue-400'
		}
		if (
			dueDateDisplay?.displayText === 'Yesterday' ||
			dueDateDisplay?.displayText.includes('ago')
		) {
			return 'text-red-600 dark:text-red-400'
		}
		return ''
	})()

	return (
		<Card
			className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			role='button'
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			<CardHeader className='flex items-center'>
				{/* Rating dropdown - left */}
				{rating && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='gap-1 rounded-lg text-xs capitalize'
								onClick={e => e.stopPropagation()}
								size='sm'
								variant='outline'
							>
								{getRatingIcon(rating)}
								{rating}
								<ChevronDown className='h-3 w-3' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start' side='bottom' sideOffset={2}>
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
				<div className='flex-1' />

				{/* More menu - right */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true}>
						<Button
							className='h-3 w-3 p-0'
							onClick={e => e.stopPropagation()}
							size='sm'
							title='More options'
							variant='ghost'
						>
							<MoreHorizontal className='h-3 w-3' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
						<DropdownMenuItem onClick={handleRemoveFromReview}>
							<GitPullRequestClosed className='mr-2 h-4 w-4' />
							Remove from review
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</CardHeader>
			<CardContent className='flex flex-col gap-0.5'>
				{/* Content - Name and Notes */}
				{topic.name && (
					<h3 className='break-word font-semibold leading-tight [overflow-wrap:anywhere]'>
						{topic.name}
					</h3>
				)}
				{topic.notes && (
					<p className='break-word text-sm [overflow-wrap:anywhere]'>
						{topic.notes}
					</p>
				)}
			</CardContent>

			{/* Bottom row: Due date */}
			<CardFooter className='text-muted-foreground text-xs'>
				{dueDateDisplay ? (
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<Calendar className={`h-3 w-3 ${dueDateColorClass}`} />
								<span className={dueDateColorClass}>
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
			</CardFooter>
		</Card>
	)
}
