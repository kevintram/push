import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import type { ComponentProps, MouseEventHandler } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { CountBadge } from '~/components/ui/count-badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { localDateString } from '~/utils/date'
import { useCreateReview } from '../api/createReview'
import { getReviews } from '../api/getReviews'
import { reviewKeys } from '../api/queryKeys'
import { useReviewDialog } from '../hooks/useReviewDialog'
import type { Rating, ReviewListItem } from '../types/review.types'
import {
	getLatestCompletedReview,
	splitReviews
} from '../utils/reviewCollections'
import {
	getReviewCreatedToastActionLabel,
	getReviewCreatedToastDescription
} from '../utils/reviewToastDescription'
import { ReviewItem } from './ReviewItem'
import {
	getOptionIcon,
	type ReviewRatingState,
	ratingOptions
} from './reviewRatingOptions'

type ReviewsMenuProps = {
	reviewCardId: number
	align?: 'start' | 'center' | 'end'
	buttonClassName?: string
	buttonSize?: NonNullable<ComponentProps<typeof Button>['size']>
	buttonVariant?: NonNullable<ComponentProps<typeof Button>['variant']>
	disabled?: boolean
	onSeeAll?: () => void
	onTriggerClick?: MouseEventHandler<HTMLButtonElement>
	onTriggerKeyDown?: ComponentProps<typeof Button>['onKeyDown']
	reviews?: Array<ReviewListItem>
	compactTriggerBadges?: boolean
}

export function ReviewsMenu({
	reviewCardId,
	align = 'end',
	buttonClassName,
	buttonSize = 'sm',
	buttonVariant = 'default',
	disabled = false,
	onSeeAll,
	onTriggerClick,
	onTriggerKeyDown,
	reviews: providedReviews,
	compactTriggerBadges = false
}: ReviewsMenuProps) {
	const navigate = useNavigate()
	const [, setIsOpen] = useState(false)
	const { data: queriedReviews = [] } = useQuery({
		queryKey: reviewKeys.list({ reviewCardId }),
		queryFn: () => getReviews({ reviewCardId }),
		enabled: providedReviews === undefined
	})
	const reviews = providedReviews ?? queriedReviews
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()

	const { uncompletedUnscheduledReviews, overdueReviews, todayReviews } =
		useMemo(() => splitReviews(reviews), [reviews])
	const dueReviews = useMemo(
		() => [...overdueReviews, ...todayReviews],
		[overdueReviews, todayReviews]
	)
	const latestCompletedReview = useMemo(
		() => getLatestCompletedReview(reviews),
		[reviews]
	)
	const overdueCount = overdueReviews.length
	const dueTodayCount = todayReviews.length
	const unscheduledCount = uncompletedUnscheduledReviews.length
	const triggerBadgeClassName = compactTriggerBadges
		? 'pointer-events-none h-4 min-w-4 px-1 text-[10px]'
		: 'pointer-events-none'
	const uncompletedOption = useMemo(
		() => ratingOptions.find(option => option.value === 'uncompleted') ?? null,
		[]
	)
	const completedOptions = useMemo(
		() => ratingOptions.filter(option => option.value !== 'uncompleted'),
		[]
	)

	const createReview = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			const review = await createReviewMutation.mutateAsync({
				review_card_id: reviewCardId,
				rating,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			})

			if (completedAt == null) {
				openReviewDialog(review.id)
				return
			}

			toast('Review created', {
				description: getReviewCreatedToastDescription(review),
				action: {
					label: getReviewCreatedToastActionLabel(review),
					onClick: () => openReviewDialog(review.id)
				}
			})
		},
		[createReviewMutation, openReviewDialog, reviewCardId]
	)

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			if (createReviewMutation.isPending) return

			try {
				if (ratingState === 'uncompleted') {
					await createReview(null, null)
				} else {
					await createReview(localDateString(), ratingState)
				}
			} catch {
				toast.error('Failed to create review')
			}
		},
		[createReview, createReviewMutation.isPending]
	)

	const handleSeeAll = useCallback(() => {
		if (onSeeAll) {
			onSeeAll()
			return
		}

		navigate({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: reviewCardId.toString() },
			search: { tab: 'reviews' }
		})
	}, [navigate, onSeeAll, reviewCardId])

	return (
		<DropdownMenu onOpenChange={setIsOpen}>
			<DropdownMenuTrigger
				disabled={disabled || createReviewMutation.isPending}
				render={
					<Button
						className={buttonClassName}
						onClick={onTriggerClick}
						onKeyDown={onTriggerKeyDown}
						size={buttonSize}
						variant={buttonVariant}
					>
						{createReviewMutation.isPending ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : null}
						<span>Reviews</span>
						{unscheduledCount > 0 ? (
							<CountBadge
								className={triggerBadgeClassName}
								count={unscheduledCount}
								data-testid='reviews-trigger-unscheduled-count'
								variant='default'
							/>
						) : null}
						{overdueCount > 0 ? (
							<CountBadge
								className={`${triggerBadgeClassName} bg-red-600 text-white dark:bg-red-400`}
								count={overdueCount}
								data-testid='reviews-trigger-overdue-count'
							/>
						) : null}
						{dueTodayCount > 0 ? (
							<CountBadge
								className={`${triggerBadgeClassName} bg-transparent text-blue-600 dark:text-blue-400`}
								count={dueTodayCount}
								data-testid='reviews-trigger-due-today-count'
							/>
						) : null}
						<ChevronDown className='h-4 w-4' />
					</Button>
				}
			/>
			<DropdownMenuContent
				align={align}
				className='w-[18rem] max-w-[calc(100vw-2rem)]'
				matchTriggerWidth={false}
			>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger disabled={createReviewMutation.isPending}>
						<Plus className='h-4 w-4' />
						Create new
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className='w-48'>
						{uncompletedOption ? (
							<DropdownMenuItem
								disabled={createReviewMutation.isPending}
								onClick={() => handleRatingSelect(uncompletedOption.value)}
							>
								<div className='grid w-full grid-cols-[auto_1fr] items-center gap-x-2'>
									{getOptionIcon(uncompletedOption.value)}
									<span>{uncompletedOption.label}</span>
									<span className='col-start-2 text-muted-foreground/70 text-xs'>
										For later
									</span>
								</div>
							</DropdownMenuItem>
						) : null}
						<DropdownMenuSeparator />
						{completedOptions.map(option => (
							<DropdownMenuItem
								disabled={createReviewMutation.isPending}
								key={option.value}
								onClick={() => handleRatingSelect(option.value)}
							>
								<div className='grid w-full grid-cols-[auto_1fr] items-center gap-x-2'>
									{getOptionIcon(option.value)}
									<span>{option.label}</span>
								</div>
							</DropdownMenuItem>
						))}
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				{dueReviews.length > 0 ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuLabel>Due</DropdownMenuLabel>
							{dueReviews.map(review => (
								<div className='px-1' key={review.id}>
									<ReviewItem
										entry={review}
										onReviewClick={reviewId => {
											setIsOpen(false)
											openReviewDialog(reviewId)
										}}
										showCardColumn={false}
										variant='default'
									/>
								</div>
							))}
						</DropdownMenuGroup>
					</>
				) : null}

				{latestCompletedReview ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuLabel>Last reviewed</DropdownMenuLabel>
							<div className='px-1'>
								<ReviewItem
									entry={latestCompletedReview}
									onReviewClick={reviewId => {
										setIsOpen(false)
										openReviewDialog(reviewId)
									}}
									showCardColumn={false}
									variant='default'
								/>
							</div>
						</DropdownMenuGroup>
					</>
				) : null}

				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleSeeAll}>
					<div className='flex min-w-0 flex-1 items-center gap-2'>
						<span className='font-medium'>See all</span>
						{uncompletedUnscheduledReviews.length > 0 ? (
							<Badge
								className='h-5 rounded-full px-1.5 text-xs'
								variant='outline'
							>
								{uncompletedUnscheduledReviews.length}
							</Badge>
						) : null}
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
