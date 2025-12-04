import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
	BicepsFlexed,
	Calendar,
	Loader2,
	Mountain,
	Plus,
	Square,
	SquareCheck
} from 'lucide-react'
import { use, useCallback, useMemo } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger
} from '~/components/ui/HoverCard'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import { Toggle } from '~/components/ui/Toggle'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import { useCreateReview } from '~/features/reviews/hooks'
import { createTopicReview } from '~/features/topic_reviews/api'
import type { Rating } from '~/models/review-topic.types'
import { updateTopic as updateTopicApi } from '../../../api/updateTopic'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { ReviewsDataProvider, useReviewsData } from './ReviewsDataContext'

function roundToTwoDecimals(num: number): number {
	return Math.round(num * 100) / 100
}

interface ReviewsSidebarProps {
	readonly?: boolean
}

function ReviewsSidebarContent({ readonly = false }: ReviewsSidebarProps) {
	const { scheduledReviews, unscheduledReviews } = useReviewsData()
	const { openReviewDialog } = useReviewTopicDialog()
	const { topic } = use(TopicContext)
	const queryClient = useQueryClient()

	const { createReview: createReviewMutation, isPending: isCreatingReview } =
		useCreateReview()
	const { mutateAsync: createTopicReviewMutation } = useMutation({
		mutationFn: ({
			reviewId,
			topicId,
			rating
		}: {
			reviewId: number
			topicId: number
			rating: Rating | null
		}) => createTopicReview(reviewId, topicId, rating),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['topics'] })
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	const { mutateAsync: updateTopicMutation } = useMutation({
		mutationFn: updateTopicApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['topics'] })
		}
	})

	const handleSrsToggle = useCallback(
		async (pressed: boolean) => {
			if (!topic || readonly) return
			await updateTopicMutation({
				id: topic.id,
				srs_enabled: pressed
			})
		},
		[topic, readonly, updateTopicMutation]
	)

	const isCreatingReviewWithTopic = isCreatingReview

	const createReviewWithTopic = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			if (!topic) throw new Error('Topic not found')

			const review = await createReviewMutation({
				description: '',
				scheduledAt: null,
				completedAt
			})
			queryClient.setQueryData(['reviews', review.id], review)

			createTopicReviewMutation({
				reviewId: review.id,
				topicId: topic.id,
				rating
			}).catch(error => {
				throw error
			})

			openReviewDialog(review.id)
		},
		[
			topic,
			createReviewMutation,
			createTopicReviewMutation,
			openReviewDialog,
			queryClient
		]
	)

	const handleLogReviewNow = useCallback(async () => {
		const today = new Date().toISOString().split('T')[0] ?? '' // YYYY-MM-DD format
		await createReviewWithTopic(today, 'good')
	}, [createReviewWithTopic])

	const handleNewReviewForLater = useCallback(async () => {
		await createReviewWithTopic(null, null)
	}, [createReviewWithTopic])

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			if (readonly) return
			openReviewDialog(reviewId)
		},
		[openReviewDialog, readonly]
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
					{!readonly && (
						<DropdownMenu>
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<DropdownMenuTrigger asChild={true}>
										<Button
											disabled={isCreatingReviewWithTopic}
											size='sm'
											variant='ghost'
										>
											{isCreatingReviewWithTopic ? (
												<Loader2 className='animate-spin' />
											) : (
												<Plus />
											)}
										</Button>
									</DropdownMenuTrigger>
								</TooltipTrigger>
								<TooltipContent>
									{isCreatingReviewWithTopic
										? 'Creating review...'
										: 'Create new review'}
								</TooltipContent>
							</Tooltip>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									disabled={isCreatingReviewWithTopic}
									onClick={handleLogReviewNow}
								>
									<SquareCheck />
									Log review now
								</DropdownMenuItem>
								<DropdownMenuItem
									disabled={isCreatingReviewWithTopic}
									onClick={handleNewReviewForLater}
								>
									<Square />
									For later
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
				<div className='flex items-center text-muted-foreground text-xs'>
					<HoverCard openDelay={300}>
						<HoverCardTrigger asChild={true}>
							<Toggle
								aria-label='Toggle SRS scheduling'
								className='h-6 px-1.5 data-[state=on]:bg-transparent data-[state=off]:text-muted-foreground data-[state=on]:text-accent-foreground'
								disabled={readonly}
								onPressedChange={handleSrsToggle}
								pressed={topic?.srs_enabled ?? true}
								size='sm'
								variant='outline'
							>
								<Calendar
									className={`h-3 w-3 ${topic?.srs_enabled ? 'text-foreground' : 'text-muted-foreground'}`}
								/>
								{dueDateDisplay ? (
									<span
										className={
											topic?.srs_enabled
												? dueDateColorClass || 'text-foreground'
												: 'text-muted-foreground'
										}
									>
										{dueDateDisplay.displayText}
									</span>
								) : (
									<span
										className={
											topic?.srs_enabled
												? 'text-foreground'
												: 'text-muted-foreground'
										}
									>
										None
									</span>
								)}
							</Toggle>
						</HoverCardTrigger>
						<HoverCardContent className='w-auto p-3' side='bottom'>
							<div className='flex flex-col gap-1'>
								<div className='font-semibold text-sm'>
									{dueDateDisplay
										? `Due on ${dayjs(dueDateDisplay.dueDate).format('MMMM D, YYYY')}`
										: 'No due date set'}
								</div>
								<p className='text-muted-foreground text-xs'>
									{topic?.srs_enabled ? 'SRS Enabled' : 'SRS Disabled'}
								</p>
							</div>
						</HoverCardContent>
					</HoverCard>
					&nbsp;·&nbsp;
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
								readonly={readonly}
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
									readonly={readonly}
								/>
							))}
						</div>
					</div>
				)}
			</SidebarContent>
		</Sidebar>
	)
}

export function ReviewsSidebar({ readonly = false }: ReviewsSidebarProps) {
	const { topic: selectedTopic } = use(TopicContext)

	return (
		<ReviewsDataProvider selectedTopicId={selectedTopic?.id}>
			<ReviewsSidebarContent readonly={readonly} />
		</ReviewsDataProvider>
	)
}
