import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BicepsFlexed, Calendar, Mountain, Plus } from 'lucide-react'
import { use, useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { createReview } from '~/features/reviews/api'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import { createTopicReview } from '~/features/topic_reviews/api'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { ReviewsDataProvider, useReviewsData } from './ReviewsDataContext'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'

function roundToTwoDecimals(num: number): number {
	return Math.round(num * 100) / 100
}

function ReviewsSidebarContent() {
	const { scheduledReviews, unscheduledReviews } = useReviewsData()
	const { openReviewDialog } = useReviewTopicDialog()
	const { topic } = use(TopicContext)

	const queryClient = useQueryClient()

	const { mutateAsync: createReviewMutation } = useMutation({
		mutationFn: createReview,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const { mutateAsync: createTopicReviewMutation } = useMutation({
		mutationFn: ({
			reviewId,
			topicId
		}: {
			reviewId: number
			topicId: number
		}) => createTopicReview(reviewId, topicId, 'good'),
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const handleNewReview = useCallback(async () => {
		if (!topic) return

		const review = await createReviewMutation({
			description: '',
			scheduledAt: null,
			completedAt: null
		})

		await createTopicReviewMutation({
			reviewId: review.id,
			topicId: topic.id
		})
		openReviewDialog(review.id)
	}, [topic, createReviewMutation, createTopicReviewMutation, openReviewDialog])

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			openReviewDialog(reviewId)
		},
		[openReviewDialog]
	)

	// Calculate the due date display
	const dueDateDisplay = useMemo(() => {
		if (!topic?.due) return null

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
	}, [topic?.due])

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

	const stabilityText =
		topic?.stability != null ? `${Math.round(topic.stability)}d` : 'No data'
	const stabilityTooltip =
		topic?.stability != null
			? `Stable for ${Math.round(topic.stability)} days`
			: 'Stability not yet calculated'

	const difficultyText =
		topic?.difficulty != null
			? `${roundToTwoDecimals(topic.difficulty)}/10`
			: 'No data'
	const difficultyTooltip =
		topic?.difficulty != null
			? `${roundToTwoDecimals(topic.difficulty)}/10 difficulty`
			: 'Difficulty not yet calculated'

	return (
		<Sidebar className='absolute border-l' side='right'>
			<SidebarHeader className='flex flex-col gap-0 pb-0'>
				<div className='flex flex-row items-center justify-between'>
					<h1 className='font-semibold text-lg'>Reviews</h1>
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<Button onClick={handleNewReview} size='sm' variant='ghost'>
								<Plus />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Create new review</TooltipContent>
					</Tooltip>
				</div>
				<div className='flex text-muted-foreground text-xs'>
					{dueDateDisplay ? (
						<>
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
							&nbsp;·&nbsp;
						</>
					) : (
						<>
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<div className='flex items-center gap-1'>
										<Calendar className='h-3 w-3' />
										<span>None</span>
									</div>
								</TooltipTrigger>
								<TooltipContent side='bottom'>No due date</TooltipContent>
							</Tooltip>
							&nbsp;·&nbsp;
						</>
					)}
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<BicepsFlexed className='h-3 w-3' />
								<span>{stabilityText}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>{stabilityTooltip}</TooltipContent>
					</Tooltip>
					&nbsp;·&nbsp;
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1'>
								<Mountain className='h-3 w-3' />
								<span>{difficultyText}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side='bottom'>{difficultyTooltip}</TooltipContent>
					</Tooltip>
				</div>
			</SidebarHeader>
			<SidebarContent className='scrollbar-track-transparent flex h-full flex-col gap-6 overflow-auto overscroll-contain px-2 pb-2'>
				{/* Scheduled Reviews Section */}
				{scheduledReviews.length > 0 && (
					<div className='flex flex-col'>
						{scheduledReviews.map(entry => (
							<ReviewItem
								entry={entry}
								key={entry.id}
								onReviewClick={handleReviewClick}
							/>
						))}
					</div>
				)}

				{/* Unscheduled Reviews Section */}
				{unscheduledReviews.length > 0 && (
					<div className='flex flex-col'>
						<div className='flex flex-row items-center gap-2 pt-6'>
							<h2 className='font-semibold text-sm'>Unscheduled</h2>
						</div>
						<div className='flex flex-col'>
							{unscheduledReviews.map(entry => (
								<ReviewItem
									entry={entry}
									key={entry.id}
									onReviewClick={handleReviewClick}
								/>
							))}
						</div>
					</div>
				)}
			</SidebarContent>
		</Sidebar>
	)
}

export function ReviewsSidebar() {
	const { topic: selectedTopic } = use(TopicContext)

	return (
		<ReviewsDataProvider selectedTopicId={selectedTopic?.id}>
			<ReviewsSidebarContent />
		</ReviewsDataProvider>
	)
}
