import {
	BicepsFlexed,
	Flag,
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
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import { Switch } from '~/components/ui/Switch'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useCreateTopicReview } from '~/features/reviews/api/createTopicReview'
import { useReviewsByTopic } from '~/features/reviews/api/getReviews'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import type { Rating, Review } from '~/features/reviews/types/review.types'
import { getDateColor, getDueDateDisplay } from '~/utils/dueDate'
import { useUpdateTopic } from '../../api/updateTopic'
import { TopicContext } from '../../stores/SelectedTopicContext'

function roundToTwoDecimals(num: number): number {
	return Math.round(num * 100) / 100
}

interface ReviewsSidebarProps {
	readonly?: boolean
}

function ReviewsSidebarContent({ readonly = false }: ReviewsSidebarProps) {
	const { openReviewDialog } = useReviewTopicDialog()
	const { topic } = use(TopicContext)
	const { data: reviews = [] } = useReviewsByTopic(topic?.id)

	const { scheduledReviews, unscheduledReviews } = useMemo(() => {
		const scheduled: Array<Review> = []
		const unscheduled: Array<Review> = []

		for (const review of reviews) {
			if (review.effective_date) {
				scheduled.push(review)
			} else {
				unscheduled.push(review)
			}
		}

		scheduled.sort((a, b) => {
			return (
				new Date(a.effective_date!).getTime() -
				new Date(b.effective_date!).getTime()
			)
		})

		unscheduled.sort((a, b) => {
			return (
				new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
			)
		})

		return {
			scheduledReviews: scheduled,
			unscheduledReviews: unscheduled
		}
	}, [reviews])

	const createTopicReviewMutation = useCreateTopicReview()
	const updateTopicMutation = useUpdateTopic()

	const isCreatingTopicReview = createTopicReviewMutation.isPending

	const handleSrsToggle = useCallback(
		async (pressed: boolean) => {
			if (!topic || readonly) return
			await updateTopicMutation.mutateAsync({
				id: topic.id,
				srs_enabled: pressed
			})
		},
		[topic, readonly, updateTopicMutation]
	)

	const isCreatingReviewWithTopic = isCreatingTopicReview

	const createReviewWithTopic = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			if (!topic) throw new Error('Topic not found')

			// Create review and link to topic in a single API call
			const topicReview = await createTopicReviewMutation.mutateAsync({
				topic_id: topic.id,
				review: {
					description: '',
					notes: '',
					scheduled_at: null,
					completed_at: completedAt
				},
				rating
			})

			openReviewDialog(topicReview.review_id)
		},
		[topic, createTopicReviewMutation, openReviewDialog]
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

	// Calculate the due date display using shared utilities
	const dueDateDisplay = useMemo(
		() => getDueDateDisplay(topic?.due ?? null),
		[topic?.due]
	)

	const dueDateColorClass = useMemo(
		() =>
			getDateColor(
				dueDateDisplay?.displayText ?? null,
				topic?.srs_enabled ?? true
			),
		[dueDateDisplay?.displayText, topic?.srs_enabled]
	)

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
					<div className='flex items-center gap-1 rounded-md border-1 p-1.5'>
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<div className='flex items-center gap-1'>
									<Flag className={`h-3 w-3 ${dueDateColorClass}`} />
									<span className={dueDateColorClass}>
										{dueDateDisplay ? dueDateDisplay.displayText : 'None'}
									</span>
									<Switch
										checked={topic?.srs_enabled ?? true}
										disabled={readonly}
										onCheckedChange={handleSrsToggle}
									/>
								</div>
							</TooltipTrigger>
							<TooltipContent side='bottom'>
								{topic?.srs_enabled ? 'SRS enabled' : 'SRS disabled'}
							</TooltipContent>
						</Tooltip>
					</div>
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
					&nbsp;·&nbsp;
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
	return <ReviewsSidebarContent readonly={readonly} />
}
