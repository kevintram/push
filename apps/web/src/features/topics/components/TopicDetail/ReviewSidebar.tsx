import dayjs from 'dayjs'
import {
	BicepsFlexed,
	Flag,
	Loader2,
	Plus,
	Square,
	SquareCheck
} from 'lucide-react'
import { use, useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Sidebar, SidebarContent, SidebarHeader } from '~/components/ui/Sidebar'
import { Skeleton } from '~/components/ui/Skeleton'
import { Switch } from '~/components/ui/Switch'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviewsByTopic } from '~/features/reviews/api/getReviews'
import { ReviewDialog } from '~/features/reviews/components/ReviewDialog'
import { ReviewItem } from '~/features/reviews/components/ReviewItem'
import type {
	Rating,
	ReviewListItem
} from '~/features/reviews/types/review.types'
import { getDateColor, getDueDateDisplay } from '~/utils/dueDate'
import { useUpdateTopic } from '../../api/updateTopic'
import { TopicContext } from '../../stores/SelectedTopicContext'

interface ReviewsSidebarProps {
	readonly?: boolean
}

function ReviewsSidebarContent({ readonly = false }: ReviewsSidebarProps) {
	const { topic } = use(TopicContext)
	const { data: reviews = [], isLoading } = useReviewsByTopic(topic?.id)
	const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const { scheduledReviews, unscheduledReviews } = useMemo(() => {
		const scheduled: Array<ReviewListItem> = []
		const unscheduled: Array<ReviewListItem> = []

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

	const createReviewMutation = useCreateReview()
	const { mutateAsync: updateTopic, isPending: isUpdatingTopic } =
		useUpdateTopic()

	const isCreatingReview = createReviewMutation.isPending

	const handleSrsToggle = useCallback(
		async (pressed: boolean) => {
			if (!topic || readonly) return
			await updateTopic({
				id: topic.id,
				srs_enabled: pressed
			})
		},
		[topic, readonly, updateTopic]
	)

	const isCreatingReviewWithTopic = isCreatingReview

	const createReviewWithTopic = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			if (!topic) throw new Error('Topic not found')

			// Create review and link to topic in a single API call
			const review = await createReviewMutation.mutateAsync({
				topic_id: topic.id,
				review_session: {
					description: 'Created',
					notes: '',
					scheduled_at: null,
					completed_at: completedAt
				},
				rating,
				description: 'Created',
				scheduled_at: null,
				completed_at: completedAt
			})

			// Open the review dialog with the newly created review
			setSelectedReviewId(review.id)
			setIsDialogOpen(true)
		},
		[topic, createReviewMutation]
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
			setSelectedReviewId(reviewId)
			setIsDialogOpen(true)
		},
		[readonly]
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
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<div className='flex items-center gap-1 rounded-lg border-1 bg-secondary p-1.5 hover:bg-secondary/80'>
								<Switch
									checked={topic?.srs_enabled ?? true}
									className='mx-0.5'
									disabled={isUpdatingTopic}
									onCheckedChange={handleSrsToggle}
									size='sm'
								/>
								<Flag className={`h-3 w-3 ${dueDateColorClass}`} />
								<span className={dueDateColorClass}>
									{dueDateDisplay ? dueDateDisplay.displayText : 'None'}
								</span>
							</div>
						</TooltipTrigger>
						<TooltipContent className='text-center' side='bottom'>
							<span>
								{topic?.due
									? `Due on ${dayjs(topic.due).format('MMMM D, YYYY')}`
									: 'No due date'}
							</span>
							<br />
							<span className='italic'>
								{topic?.srs_enabled ? '(enabled)' : '(disabled)'}
							</span>
						</TooltipContent>
					</Tooltip>
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
				</div>
			</SidebarHeader>
			<SidebarContent className='scrollbar-track-transparent flex h-full flex-col gap-6 overflow-auto overscroll-contain px-2 pb-2'>
				{isLoading ? (
					<div className='flex flex-col gap-4'>
						{[0, 1, 2, 3, 4].map(i => (
							<div
								className='flex flex-col gap-2 rounded-lg p-3'
								key={`skeleton-review-${i}`}
							>
								<div className='flex items-start justify-between'>
									<Skeleton className='h-5 w-3/4' />
									<Skeleton className='h-5 w-16' />
								</div>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-2/3' />
								<div className='mt-2 flex gap-2'>
									<Skeleton className='h-5 w-16 rounded-full' />
									<Skeleton className='h-5 w-20 rounded-full' />
								</div>
							</div>
						))}
					</div>
				) : (
					<>
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
					</>
				)}
			</SidebarContent>
			<ReviewDialog
				onOpenChange={setIsDialogOpen}
				open={isDialogOpen}
				reviewId={selectedReviewId}
			/>
		</Sidebar>
	)
}

export function ReviewsSidebar({ readonly = false }: ReviewsSidebarProps) {
	return <ReviewsSidebarContent readonly={readonly} />
}
