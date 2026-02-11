import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import {
	Archive,
	Brain,
	ChevronDown,
	Inbox,
	Loader2,
	MoreHorizontal,
	Plus,
	Sparkles,
	Star
} from 'lucide-react'
import {
	type ChangeEvent,
	type ReactElement,
	type ReactNode,
	useCallback,
	useMemo
} from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/Button'
import { ButtonGroup, ButtonGroupSeparator } from '~/components/ui/ButtonGroup'
import { Textarea } from '~/components/ui/Textarea'
import { Toggle } from '~/components/ui/Toggle'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { useReviews } from '~/features/reviews/api/getReviews'
import { RatingDropdown } from '~/features/reviews/components/RatingDropdown'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { GetReviewsFilters } from '~/features/reviews/types/api.types'
import type {
	Rating,
	ReviewListItem
} from '~/features/reviews/types/review.types'
import type { LearnableMetrics } from '~/hooks/useLearnableMetrics'
import { cn } from '~/lib/utils'
import { localDateString } from '~/utils/date'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { getRatingIcon } from '~/utils/getRatingIcon'

type EntityType = 'topic' | 'source' | 'practice'

interface LearnableDetailHeaderProps {
	entityId: number
	entityType: EntityType
	entityLabel: string
	title: string
	titlePlaceholder?: string
	onTitleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
	metrics: LearnableMetrics
	createdAt: string
	updatedAt: string
	srsEnabled: boolean
	onSrsToggle: (pressed: boolean) => void | Promise<void>
	archived: boolean
	onArchiveToggle: () => void
	inboxed: boolean
	onInboxToggle: () => void
	isUpdating: boolean
	readonly?: boolean
	renderTypeChangeMenu?: (trigger: ReactElement) => ReactNode
	renderActionMenu: (trigger: ReactNode) => ReactNode
}

function toReviewFilters(
	entityType: EntityType,
	entityId: number
): GetReviewsFilters {
	if (entityType === 'topic') return { topicId: entityId }
	if (entityType === 'source') return { sourceId: entityId }
	return { practiceId: entityId }
}

function getLatestCompletedReview(
	reviews: Array<ReviewListItem>
): ReviewListItem | null {
	let latest: ReviewListItem | null = null

	for (const review of reviews) {
		if (!review.completed_at) {
			continue
		}

		if (!latest) {
			latest = review
			continue
		}

		if (
			new Date(review.completed_at).getTime() >
			new Date(latest.completed_at ?? 0).getTime()
		) {
			latest = review
		}
	}

	return latest
}

export function LearnableDetailHeader({
	entityId,
	entityType,
	entityLabel,
	title,
	titlePlaceholder = 'Title',
	onTitleChange,
	metrics,
	createdAt,
	updatedAt,
	srsEnabled,
	onSrsToggle,
	archived,
	onArchiveToggle,
	inboxed,
	onInboxToggle,
	isUpdating,
	readonly = false,
	renderTypeChangeMenu,
	renderActionMenu
}: LearnableDetailHeaderProps) {
	const navigate = useNavigate()
	const filters = useMemo(
		() => toReviewFilters(entityType, entityId),
		[entityType, entityId]
	)
	const { data: reviews = [] } = useReviews(filters)
	const createReviewMutation = useCreateReview()
	const { openReviewDialog } = useReviewDialog()
	const isCreatingReview = createReviewMutation.isPending

	const latestCompletedReview = useMemo(
		() => getLatestCompletedReview(reviews),
		[reviews]
	)

	const rating = latestCompletedReview?.rating ?? null
	const lastReviewedText = formatRelativeDate(
		latestCompletedReview?.completed_at ?? null,
		{
			includeFuture: false,
			nullLabel: 'never'
		}
	).text

	const handleNavigateToReviews = useCallback(() => {
		if (entityType === 'topic') {
			navigate({
				to: '/topics/$topicId/reviews',
				params: { topicId: entityId.toString() }
			})
			return
		}

		if (entityType === 'source') {
			navigate({
				to: '/sources/$sourceId/reviews',
				params: { sourceId: entityId.toString() }
			})
			return
		}

		navigate({
			to: '/practices/$practiceId/reviews',
			params: { practiceId: entityId.toString() }
		})
	}, [entityType, entityId, navigate])

	const handleOpenLastReview = useCallback(() => {
		if (latestCompletedReview?.id) {
			openReviewDialog(latestCompletedReview.id)
		}
	}, [latestCompletedReview?.id, openReviewDialog])

	const createReview = useCallback(
		(completedAt: string | null, ratingValue: Rating | null) => {
			const basePayload = {
				rating: ratingValue,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			}

			if (entityType === 'topic') {
				return createReviewMutation.mutateAsync({
					...basePayload,
					topic_id: entityId
				})
			}

			if (entityType === 'source') {
				return createReviewMutation.mutateAsync({
					...basePayload,
					source_id: entityId
				})
			}

			return createReviewMutation.mutateAsync({
				...basePayload,
				practice_id: entityId
			})
		},
		[entityId, entityType, createReviewMutation]
	)

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			try {
				const review =
					ratingState === 'uncompleted'
						? await createReview(null, null)
						: await createReview(localDateString(), ratingState)

				toast('Review created', {
					action: {
						label: 'Open',
						onClick: () => openReviewDialog(review.id)
					}
				})
			} catch {
				toast.error('Failed to create review')
			}
		},
		[createReview, openReviewDialog]
	)

	const {
		isUnreviewed,
		freshnessTierInfo,
		freshnessTierColor,
		stabilityText,
		stabilityTooltipText
	} = metrics

	const actionMenuTrigger = (
		<Button
			className='rounded-full'
			size='icon-sm'
			title='More options'
			variant='outline'
		>
			<MoreHorizontal className='h-4 w-4' />
		</Button>
	)

	const typeMenuTrigger = (
		<Button
			className='-ml-2 h-7 rounded-md px-2 font-semibold text-muted-foreground text-sm'
			disabled={readonly}
			size='sm'
			variant='ghost'
		>
			<span>{entityLabel}</span>
		</Button>
	)

	return (
		<div>
			{/* Properties Row 1 */}
			<div className='flex flex-wrap items-center justify-between gap-x-1 font-semibold text-muted-foreground text-sm'>
				{renderTypeChangeMenu ? (
					renderTypeChangeMenu(typeMenuTrigger)
				) : (
					<span>{entityLabel}</span>
				)}
				<div className='flex flex-wrap items-center gap-2'>
					<Tooltip>
						<TooltipTrigger
							render={<span>Edited {formatRelativeDate(updatedAt).text}</span>}
						/>
						<TooltipContent side='bottom'>
							{dayjs(updatedAt).format('MMM D, YYYY')}
						</TooltipContent>
					</Tooltip>
					<span aria-hidden={true} className='font-bold'>
						·
					</span>
					<Tooltip>
						<TooltipTrigger
							render={<span>Created {formatRelativeDate(createdAt).text}</span>}
						/>
						<TooltipContent side='bottom'>
							{dayjs(createdAt).format('MMM D, YYYY')}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{/* Title row */}
			<Textarea
				className='!bg-transparent !text-2xl m-0 min-h-0 resize-none overflow-hidden break-words rounded-none border-none p-0 pb-1 font-semibold leading-tight shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
				onChange={onTitleChange}
				placeholder={titlePlaceholder}
				spellCheck={false}
				value={title}
			/>

			{/* Properties Row 2 */}
			<div className='flex flex-wrap items-center gap-2 text-sm'>
				{isUnreviewed ? (
					<div className='flex items-center gap-1.5 font-semibold text-muted-foreground'>
						<Sparkles className='h-4 w-4' />
						<span>Unreviewed</span>
					</div>
				) : (
					<>
						<Tooltip>
							<TooltipTrigger
								render={
									<div
										className={`flex items-center gap-1.5 font-semibold ${freshnessTierColor}`}
									>
										<Brain className='h-4 w-4' />
										<span>{freshnessTierInfo.label}</span>
									</div>
								}
							/>
							<TooltipContent side='bottom'>
								{freshnessTierInfo.tooltip ??
									'Complete a review to see freshness tier'}
							</TooltipContent>
						</Tooltip>
						{latestCompletedReview && (
							<>
								<span aria-hidden={true} className='font-bold'>
									·
								</span>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												className='h-auto gap-1 p-0 font-semibold text-muted-foreground text-sm'
												disabled={readonly}
												onClick={handleOpenLastReview}
												size='default'
												variant='link'
											>
												<span>Reviewed {lastReviewedText}</span>
												{rating ? (
													<span
														className={cn(
															'flex size-4 shrink-0 items-center justify-center rounded-full border border-input shadow-xs dark:bg-input/30',
															'border-primary bg-primary text-primary-foreground dark:bg-primary'
														)}
													>
														{getRatingIcon(rating)}
													</span>
												) : null}
											</Button>
										}
									/>
									<TooltipContent side='bottom'>
										{formatAbsoluteDate(latestCompletedReview.completed_at)}
									</TooltipContent>
								</Tooltip>
							</>
						)}
						<span aria-hidden={true} className='font-bold'>
							·
						</span>
						<Tooltip>
							<TooltipTrigger
								render={
									<span className='whitespace-nowrap font-semibold text-muted-foreground text-sm'>
										{stabilityText} durability
									</span>
								}
							/>
							<TooltipContent side='bottom'>
								Durable for {stabilityTooltipText} without review
							</TooltipContent>
						</Tooltip>
					</>
				)}
			</div>

			{/* Actions row */}
			<div className='my-2 flex flex-wrap items-center justify-between border-y-1 py-2'>
				<div className='flex items-center gap-2'>
					<Button
						className='rounded-full'
						disabled={readonly}
						onClick={() => onSrsToggle(!srsEnabled)}
						size='icon-sm'
						variant='outline'
					>
						<Star
							className={
								srsEnabled
									? 'h-4 w-4 fill-yellow-500 text-yellow-500'
									: 'h-4 w-4 text-muted-foreground'
							}
						/>
					</Button>
					<ButtonGroup>
						<Button
							className='rounded-full'
							disabled={readonly}
							onClick={handleNavigateToReviews}
							size='sm'
						>
							<span>Reviews</span>
						</Button>
						<ButtonGroupSeparator />
						<RatingDropdown
							align='end'
							onSelect={handleRatingSelect}
							trigger={
								<Button
									className='rounded-full'
									disabled={readonly || isCreatingReview}
									size='sm'
								>
									{isCreatingReview ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<Plus className='h-4 w-4' />
									)}
									<ChevronDown className='h-4 w-4' />
								</Button>
							}
						/>
					</ButtonGroup>
				</div>
				<div className='flex items-center gap-2'>
					<Toggle
						aria-label={inboxed ? 'Remove from inbox' : 'Add to inbox'}
						className={cn(
							'h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors',
							'data-[state=on]:bg-muted data-[state=on]:text-foreground'
						)}
						disabled={isUpdating || readonly}
						onPressedChange={onInboxToggle}
						pressed={inboxed}
						size='sm'
						variant='outline'
					>
						<Inbox className='h-4 w-4' />
					</Toggle>
					<Toggle
						aria-label={archived ? 'Unarchive' : 'Archive'}
						className={cn(
							'h-8 w-8 rounded-full p-0 text-muted-foreground transition-colors',
							'data-[state=on]:bg-muted data-[state=on]:text-foreground'
						)}
						disabled={isUpdating || readonly}
						onPressedChange={onArchiveToggle}
						pressed={archived}
						size='sm'
						variant='outline'
					>
						<Archive className='h-4 w-4' />
					</Toggle>
					{renderActionMenu(actionMenuTrigger)}
				</div>
			</div>
		</div>
	)
}
