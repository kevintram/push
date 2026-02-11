import type { QueryClient } from '@tanstack/react-query'
import {
	Archive,
	Baby,
	Brain,
	FileText,
	Inbox,
	Loader2,
	Sparkles,
	Star,
	User2
} from 'lucide-react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { SquarePlusBottomRight } from '~/components/icons'
import { Badge } from '~/components/ui/Badge'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/Card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { RatingDropdown } from '~/features/reviews/components/RatingDropdown'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { Rating } from '~/features/reviews/types/review.types'
import type { LearnableMetrics } from '~/hooks/useLearnableMetrics'
import type { LearnableBase } from '~/models/learnable.types'
import { localDateString } from '~/utils/date'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'

const MIN_HEIGHT = 96

export interface LearnableCardConfig<T extends LearnableBase> {
	/** The entity type for review creation */
	entityType: 'topic' | 'source' | 'practice'
	/** Get the primary text to display (name/title) */
	getPrimaryText: (entity: T) => string
	/** Get the secondary text to display (notes/answer) */
	getSecondaryText: (entity: T) => string | null
	/** Whether to show a type badge in the header */
	showTypeBadge: boolean
	/** Label for the type badge (e.g., "Source") */
	typeBadgeLabel?: string
	/** Get the relations count for display */
	getRelationsCount: (entity: T) => number
	/** Format relations count for tooltip (e.g., "1 child" vs "1 relation") */
	getRelationsLabel: (count: number) => string
	/** The update mutation function */
	onSrsToggle: (id: number, newValue: boolean) => void
	/** Whether the mutation is pending */
	isUpdating: boolean
	/** Prefetch entity data on hover */
	onPrefetch: (queryClient: QueryClient, entity: T) => void
}

export interface LearnableCardBaseProps<T extends LearnableBase> {
	entity: T
	config: LearnableCardConfig<T>
	metrics: LearnableMetrics
	queryClient: QueryClient
	onEntityClick?: (entity: T) => void
	minHeight?: number
	searchQuery?: string
	headerRight?: ReactNode
	showLeavingSoon?: boolean
}

export function LearnableCardBase<T extends LearnableBase>({
	entity,
	config,
	metrics,
	queryClient,
	onEntityClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	headerRight,
	showLeavingSoon = false
}: LearnableCardBaseProps<T>) {
	const {
		freshnessTierInfo,
		freshnessTierColor,
		isUnreviewed,
		isLeavingSoon,
		leavingSoonLabel,
		leavingSoonTooltip
	} = metrics

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(entity.last_reviewed_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[entity.last_reviewed_at]
	)
	const lastReviewedDate = useMemo(
		() => formatAbsoluteDate(entity.last_reviewed_at),
		[entity.last_reviewed_at]
	)

	// Search highlighting
	const primaryText = config.getPrimaryText(entity)
	const highlightedPrimary = useMemo(() => {
		if (!primaryText) return null
		if (!searchQuery?.trim()) return primaryText
		return highlightText({ text: primaryText, query: searchQuery })
	}, [primaryText, searchQuery])

	const secondaryText = config.getSecondaryText(entity)
	const highlightedSecondary = useMemo(() => {
		if (!secondaryText) return null
		if (!searchQuery?.trim()) return secondaryText
		return truncateWithHighlight(secondaryText, searchQuery, 200)
	}, [secondaryText, searchQuery])

	const handleActivate = useCallback(() => {
		onEntityClick?.(entity)
	}, [onEntityClick, entity])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onEntityClick?.(entity)
			}
		},
		[onEntityClick, entity]
	)

	const handleMouseEnter = useCallback(() => {
		config.onPrefetch(queryClient, entity)
	}, [config, queryClient, entity])

	const handleSrsToggle = useCallback(
		(e: MouseEvent) => {
			e.stopPropagation()
			config.onSrsToggle(entity.id, !entity.srs_enabled)
		},
		[config, entity.id, entity.srs_enabled]
	)

	// Review creation
	const createReviewMutation = useCreateReview()
	const isCreatingReview = createReviewMutation.isPending
	const { openReviewDialog } = useReviewDialog()

	const createReview = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			const basePayload = {
				rating,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			}

			const entityPayload =
				config.entityType === 'topic'
					? { topic_id: entity.id }
					: config.entityType === 'source'
						? { source_id: entity.id }
						: { practice_id: entity.id }

			const review = await createReviewMutation.mutateAsync({
				...basePayload,
				...entityPayload
			})

			toast('Review created', {
				action: {
					label: 'Open',
					onClick: () => openReviewDialog(review.id)
				}
			})
		},
		[
			entity.id,
			config.entityType,
			createReviewMutation.mutateAsync,
			openReviewDialog
		]
	)

	const handleRatingSelect = useCallback(
		async (ratingState: ReviewRatingState) => {
			if (isCreatingReview) return
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
		[createReview, isCreatingReview]
	)

	return (
		<Card
			className='max-h-96 cursor-pointer overflow-hidden transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			role='button'
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			<CardHeader className='-top-1 -left-1 relative flex items-start justify-between gap-2'>
				{'parent_id' in entity && (
					<Tooltip>
						<TooltipTrigger
							render={
								<div className='flex items-center gap-1 text-muted-foreground text-xs'>
									<User2 className='h-3 w-3' />
									<span>{entity.parent_id ? 1 : 0}</span>
								</div>
							}
						/>
						<TooltipContent side='top'>
							{entity.parent_id ? '1 parent' : '0 parents'}
						</TooltipContent>
					</Tooltip>
				)}
				{config.showTypeBadge && config.typeBadgeLabel && (
					<Tooltip>
						<TooltipTrigger
							render={
								<div className='flex items-center gap-1 text-muted-foreground text-xs'>
									<FileText className='h-3 w-3' />
									<span>{config.typeBadgeLabel}</span>
								</div>
							}
						/>
						<TooltipContent side='top'>
							This is a {config.typeBadgeLabel}
						</TooltipContent>
					</Tooltip>
				)}
				<div className='flex-1' />
				{/* Leaving soon badge */}
				{showLeavingSoon && isLeavingSoon && leavingSoonLabel && (
					<Tooltip>
						<TooltipTrigger
							render={
								<Badge
									className='h-5 text-xs'
									variant={
										leavingSoonLabel === 'Hazy soon' ? 'warning' : 'destructive'
									}
								>
									{leavingSoonLabel}
								</Badge>
							}
						/>
						{leavingSoonTooltip && (
							<TooltipContent side='top'>{leavingSoonTooltip}</TooltipContent>
						)}
					</Tooltip>
				)}
				{/* Add review */}
				<Tooltip>
					<RatingDropdown
						align='end'
						nativeButton={false}
						onSelect={handleRatingSelect}
						trigger={
							<TooltipTrigger
								render={
									<div
										aria-label='Add review'
										className={
											isCreatingReview ? 'opacity-50' : 'cursor-pointer'
										}
										onClick={e => e.stopPropagation()}
										onKeyDown={e => e.stopPropagation()}
										role='button'
									>
										{isCreatingReview ? (
											<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
										) : (
											<SquarePlusBottomRight className='h-4 w-4 text-muted-foreground' />
										)}
									</div>
								}
							/>
						}
					/>
					<TooltipContent side='top'>Add review</TooltipContent>
				</Tooltip>
				{/* SRS toggle */}
				<div
					className={config.isUpdating ? 'opacity-50' : 'cursor-pointer'}
					onClick={handleSrsToggle}
					onKeyDown={e => e.stopPropagation()}
				>
					{(entity.srs_enabled ?? true) ? (
						<Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
					) : (
						<Star className='h-4 w-4 text-muted-foreground' />
					)}
				</div>
				<div className='flex items-center gap-1'>{headerRight}</div>
			</CardHeader>

			<CardContent className='mb-3 flex flex-1 flex-col gap-3'>
				<div className='flex flex-col gap-1'>
					{/* Inbox/Archive indicators */}
					{(entity.inboxed || entity.archived) && (
						<div className='flex items-center gap-2 text-muted-foreground text-xs'>
							{entity.inboxed && (
								<div className='flex items-center gap-1'>
									<Inbox className='h-3 w-3' />
									<span>Inboxed</span>
								</div>
							)}
							{entity.archived && (
								<div className='flex items-center gap-1'>
									<Archive className='h-3 w-3' />
									<span>Archived</span>
								</div>
							)}
						</div>
					)}

					<div className='flex flex-col gap-0.5'>
						{highlightedPrimary && (
							<h3 className='break-word line-clamp-5 font-semibold leading-tight [overflow-wrap:anywhere]'>
								{highlightedPrimary}
							</h3>
						)}
						{highlightedSecondary && (
							<p className='break-word line-clamp-[8] text-sm [overflow-wrap:anywhere]'>
								{highlightedSecondary}
							</p>
						)}
					</div>
				</div>
			</CardContent>

			{/* Bottom row: Status info and Children */}
			<CardFooter className='gap-1 text-muted-foreground text-xs'>
				{isUnreviewed ? (
					<div className='flex items-center gap-1'>
						<Sparkles className='h-3 w-3' />
						<span>Unreviewed</span>
					</div>
				) : (
					<>
						{/* Freshness tier with tooltip */}
						{freshnessTierInfo.tooltip ? (
							<Tooltip>
								<TooltipTrigger
									render={
										<div
											className={`flex items-center gap-1 font-semibold ${freshnessTierColor}`}
										>
											<Brain className='h-3 w-3' />
											<span>{freshnessTierInfo.label}</span>
										</div>
									}
								/>
								<TooltipContent side='top'>
									{freshnessTierInfo.tooltip}
								</TooltipContent>
							</Tooltip>
						) : (
							<span className={`font-semibold ${freshnessTierColor}`}>
								{freshnessTierInfo.label}
							</span>
						)}
						{/* Last reviewed */}
						<span>·</span>
						<Tooltip>
							<TooltipTrigger
								render={
									<span className='font-semibold'>{`Reviewed ${lastReviewed.text}`}</span>
								}
							/>
							<TooltipContent side='top'>{lastReviewedDate}</TooltipContent>
						</Tooltip>
					</>
				)}
				<div className='flex-1' />
				{/* Relations count */}
				<Tooltip>
					<TooltipTrigger
						render={
							<div className='flex items-center gap-1'>
								<Baby className='h-3 w-3' />
								<span>{config.getRelationsCount(entity)}</span>
							</div>
						}
					/>
					<TooltipContent side='top'>
						{config.getRelationsLabel(config.getRelationsCount(entity))}
					</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	)
}
