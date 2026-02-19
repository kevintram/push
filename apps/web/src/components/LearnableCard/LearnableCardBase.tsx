import type { QueryClient } from '@tanstack/react-query'
import {
	Anvil,
	Archive,
	Baby,
	Brain,
	ChevronDown,
	Inbox,
	Loader2,
	Plus,
	Sparkles,
	Star,
	User2
} from 'lucide-react'
import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useCreateReview } from '~/features/reviews/api/createReview'
import { RatingDropdown } from '~/features/reviews/components/RatingDropdown'
import type { ReviewRatingState } from '~/features/reviews/components/ReviewRatingCheckbox'
import { useReviewDialog } from '~/features/reviews/hooks/useReviewDialog'
import type { Rating } from '~/features/reviews/types/review.types'
import { getReviewCreatedToastDescription } from '~/features/reviews/utils/reviewToastDescription'
import { SourceStatusPopover } from '~/features/sources/components/SourceStatusPopover'
import { getSourceStatusOption } from '~/features/sources/constants/statusOptions'
import type { SourceLifecycleStatus } from '~/features/sources/types/source.types'
import type { LearnableMetrics } from '~/hooks/useLearnableMetrics'
import type { LearnableBase } from '~/models/learnable.types'
import { useFlashcardMode } from '~/stores/FlashcardModeContext'
import { localDateString } from '~/utils/date'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { getRatingIcon } from '~/utils/getRatingIcon'
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
	/** Get the parent display label (name/title or notes) */
	getParentLabel?: (entity: T) => string | null
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
	/** Optional source status controls shown as an icon button */
	statusControl?: {
		getStatus: (entity: T) => SourceLifecycleStatus
		onStatusChange: (id: number, status: SourceLifecycleStatus) => void
		progressNote?: (entity: T) => string
		onProgressNoteChange?: (
			entity: T,
			event: ChangeEvent<HTMLTextAreaElement>
		) => void
		isUpdating: boolean
	}
}

export interface LearnableCardHeaderBadge {
	label: string
	tooltip?: string | null
	variant?:
		| 'default'
		| 'secondary'
		| 'destructive'
		| 'warning'
		| 'outline'
		| 'ghost'
		| 'link'
}

export interface LearnableCardStatusBadge {
	label: string
	tooltip?: string | null
	className?: string
	onClick?: () => void
	variant?:
		| 'default'
		| 'secondary'
		| 'destructive'
		| 'warning'
		| 'outline'
		| 'ghost'
		| 'link'
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
	headerBadge?: LearnableCardHeaderBadge
	statusBadges?: Array<LearnableCardStatusBadge>
	statusRowPlacement?: 'above-header' | 'below-header'
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
	showLeavingSoon = false,
	headerBadge,
	statusBadges = [],
	statusRowPlacement = 'below-header'
}: LearnableCardBaseProps<T>) {
	const {
		freshnessTierInfo,
		freshnessTierColor,
		isUnreviewed,
		isLeavingSoon,
		leavingSoonLabel,
		leavingSoonTooltip,
		stabilityText,
		stabilityTooltipText
	} = metrics
	const { hidesPrimary, hidesSecondary } = useFlashcardMode()
	const hideParent = hidesPrimary && entity.parent_id != null
	const [isPrimaryRevealed, setIsPrimaryRevealed] = useState(!hidesPrimary)
	const [isSecondaryRevealed, setIsSecondaryRevealed] = useState(
		!hidesSecondary
	)

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
	const hasPrimaryText = Boolean(primaryText.trim())
	const hasSecondaryText = Boolean(secondaryText?.trim())
	const hidePrimary = hidesPrimary && hasPrimaryText && !isPrimaryRevealed
	const hideSecondary =
		hidesSecondary && hasSecondaryText && !isSecondaryRevealed

	useEffect(() => {
		setIsPrimaryRevealed(!hidesPrimary)
		setIsSecondaryRevealed(!hidesSecondary)
	}, [hidesPrimary, hidesSecondary])

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
	const handleRevealPrimary = useCallback((e: MouseEvent) => {
		e.stopPropagation()
		setIsPrimaryRevealed(true)
	}, [])
	const handleRevealSecondary = useCallback((e: MouseEvent) => {
		e.stopPropagation()
		setIsSecondaryRevealed(true)
	}, [])

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
				description: getReviewCreatedToastDescription(review),
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

	const statusControl = config.statusControl
	const currentStatusOption = useMemo(() => {
		if (!statusControl) return null
		return getSourceStatusOption(statusControl.getStatus(entity))
	}, [entity, statusControl])
	const CurrentStatusIcon = currentStatusOption?.icon

	const handleStatusSelect = useCallback(
		(nextStatus: SourceLifecycleStatus) => {
			if (!statusControl) return
			const currentStatus = statusControl.getStatus(entity)
			if (currentStatus === nextStatus || statusControl.isUpdating) return
			statusControl.onStatusChange(entity.id, nextStatus)
		},
		[entity, statusControl]
	)

	const hasStatusBadges = statusBadges.length > 0
	const hasFloatingStatusRow =
		hasStatusBadges && statusRowPlacement === 'above-header'
	const statusRowClassName =
		statusRowPlacement === 'above-header'
			? 'absolute top-0 right-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-1.5 -translate-y-[45%]'
			: 'flex w-full flex-wrap items-center justify-end gap-1.5 px-5 pt-0 pb-2'

	const statusRow = hasStatusBadges ? (
		<div className={statusRowClassName}>
			{statusBadges.map((badge, index) => (
				<Tooltip key={`${badge.label}-${index}`}>
					<TooltipTrigger
						render={
							<Badge
								className={
									badge.className
										? `${badge.className} rounded-sm shadow-sm`
										: 'h-5 rounded-sm text-xs shadow-sm'
								}
								onClick={event => {
									if (!badge.onClick) {
										return
									}
									event.stopPropagation()
									badge.onClick()
								}}
								onKeyDown={event => {
									if (
										(event.key === 'Enter' || event.key === ' ') &&
										badge.onClick
									) {
										event.preventDefault()
										event.stopPropagation()
										badge.onClick()
									}
								}}
								role={badge.onClick ? 'button' : undefined}
								tabIndex={badge.onClick ? 0 : undefined}
								variant={badge.variant ?? 'outline'}
							>
								{badge.label}
							</Badge>
						}
					/>
					{badge.tooltip && <TooltipContent>{badge.tooltip}</TooltipContent>}
				</Tooltip>
			))}
		</div>
	) : null

	return (
		<Card
			className={`relative max-h-96 cursor-pointer gap-0 overflow-visible transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
				hasFloatingStatusRow ? 'pt-3' : ''
			}`}
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			role='button'
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			{statusRowPlacement === 'above-header' && statusRow}
			<CardHeader
				className={`-left-1 relative mb-1 flex items-center justify-between gap-2 ${
					hasFloatingStatusRow ? 'pt-2' : '-top-1'
				}`}
			>
				{'parent_id' in entity && !hideParent && (
					<Tooltip>
						<TooltipTrigger
							render={
								<div className='flex min-w-0 items-center gap-1 font-semibold text-muted-foreground text-xs'>
									<User2 className='h-3 w-3 shrink-0' />
									<span className='truncate'>
										{entity.parent_id
											? (config.getParentLabel?.(entity) ?? entity.parent_id)
											: 'None'}
									</span>
								</div>
							}
						/>
						<TooltipContent>
							{entity.parent_id
								? (config.getParentLabel?.(entity) ??
									`Parent #${entity.parent_id}`)
								: 'No parent'}
						</TooltipContent>
					</Tooltip>
				)}
				<div className='flex-1' />
				{/* Queue priority badge */}
				{headerBadge && (
					<Tooltip>
						<TooltipTrigger
							render={
								<Badge
									className='h-5 text-xs'
									variant={headerBadge.variant ?? 'warning'}
								>
									{headerBadge.label}
								</Badge>
							}
						/>
						{headerBadge.tooltip && (
							<TooltipContent>{headerBadge.tooltip}</TooltipContent>
						)}
					</Tooltip>
				)}
				{/* Leaving soon badge */}
				{!headerBadge &&
					showLeavingSoon &&
					isLeavingSoon &&
					leavingSoonLabel && (
						<Tooltip>
							<TooltipTrigger
								render={
									<Badge
										className='h-5 text-xs'
										variant={
											leavingSoonLabel === 'Hazy soon'
												? 'warning'
												: 'destructive'
										}
									>
										{leavingSoonLabel}
									</Badge>
								}
							/>
							{leavingSoonTooltip && (
								<TooltipContent>{leavingSoonTooltip}</TooltipContent>
							)}
						</Tooltip>
					)}
				{/* Add review */}
				<RatingDropdown
					align='end'
					onSelect={handleRatingSelect}
					trigger={
						<Button
							className='rounded-full'
							disabled={isCreatingReview}
							onClick={e => e.stopPropagation()}
							onKeyDown={e => e.stopPropagation()}
							size='xs'
							variant='tertiary'
						>
							{isCreatingReview ? (
								<Loader2 className='h-3 w-3 animate-spin' />
							) : (
								<Plus className='h-3 w-3' />
							)}
							<span>Review</span>
							<ChevronDown className='h-3 w-3' />
						</Button>
					}
				/>
				{statusControl && currentStatusOption && CurrentStatusIcon && (
					<SourceStatusPopover
						align='end'
						disabled={statusControl.isUpdating}
						onProgressNoteChange={
							statusControl.onProgressNoteChange
								? event => statusControl.onProgressNoteChange?.(entity, event)
								: undefined
						}
						onStatusChange={handleStatusSelect}
						progressNote={statusControl.progressNote?.(entity)}
						sideOffset={6}
						status={currentStatusOption.value}
						trigger={
							<Button
								aria-label={`Status: ${currentStatusOption.label}`}
								disabled={statusControl.isUpdating}
								onClick={e => e.stopPropagation()}
								onKeyDown={e => e.stopPropagation()}
								size='icon-sm'
								variant='ghost'
							>
								<CurrentStatusIcon
									className={`h-3.5 w-3.5 ${currentStatusOption.colorClassName}`}
								/>
							</Button>
						}
					/>
				)}
				{/* SRS toggle */}
				<Button
					aria-label={
						(entity.srs_enabled ?? true)
							? 'Disable SRS for this item'
							: 'Enable SRS for this item'
					}
					aria-pressed={entity.srs_enabled ?? true}
					className={config.isUpdating ? 'opacity-50' : ''}
					onClick={handleSrsToggle}
					onKeyDown={e => e.stopPropagation()}
					size='icon-sm'
					variant='ghost'
				>
					{(entity.srs_enabled ?? true) ? (
						<Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
					) : (
						<Star className='h-4 w-4 text-muted-foreground' />
					)}
				</Button>
				<div className='flex items-center gap-1'>{headerRight}</div>
			</CardHeader>
			{statusRowPlacement === 'below-header' && statusRow}

			<CardContent className='mb-3 flex flex-1 flex-col gap-3'>
				<div className='flex flex-col gap-1'>
					{/* Type / Inbox / Archive indicators */}
					{(config.typeBadgeLabel || entity.inboxed || entity.archived) && (
						<div className='flex items-center gap-1 text-muted-foreground text-xs'>
							{config.typeBadgeLabel && <span>{config.typeBadgeLabel}</span>}
							{config.typeBadgeLabel && entity.inboxed && (
								<span className='font-bold'>·</span>
							)}
							{entity.inboxed && (
								<div className='flex items-center gap-1'>
									<Inbox className='h-3 w-3' />
									<span>Inbox</span>
								</div>
							)}
							{(config.typeBadgeLabel || entity.inboxed) && entity.archived && (
								<span className='font-bold'>·</span>
							)}
							{entity.archived && (
								<div className='flex items-center gap-1'>
									<Archive className='h-3 w-3' />
									<span>Archive</span>
								</div>
							)}
						</div>
					)}

					<div className='flex flex-col gap-2'>
						{hidePrimary ? (
							<div className='relative'>
								<h3
									aria-hidden={true}
									className='break-word invisible line-clamp-5 whitespace-pre-wrap font-semibold leading-tight [overflow-wrap:anywhere]'
								>
									{highlightedPrimary}
								</h3>
								<div className='absolute inset-0'>
									<Button
										className='h-full w-full justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2 text-muted-foreground text-sm hover:bg-muted/70'
										onClick={handleRevealPrimary}
										onKeyDown={e => e.stopPropagation()}
										size='default'
										variant='outline'
									>
										Reveal
									</Button>
								</div>
							</div>
						) : (
							highlightedPrimary && (
								<h3 className='break-word line-clamp-5 whitespace-pre-wrap font-semibold leading-tight [overflow-wrap:anywhere]'>
									{highlightedPrimary}
								</h3>
							)
						)}
						{hideSecondary ? (
							<div className='relative'>
								<p
									aria-hidden={true}
									className='break-word invisible line-clamp-[8] whitespace-pre-wrap text-sm [overflow-wrap:anywhere]'
								>
									{highlightedSecondary}
								</p>
								<div className='absolute inset-0'>
									<Button
										className='h-full w-full justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2 text-muted-foreground text-sm hover:bg-muted/70'
										onClick={handleRevealSecondary}
										onKeyDown={e => e.stopPropagation()}
										size='default'
										variant='outline'
									>
										Reveal
									</Button>
								</div>
							</div>
						) : (
							highlightedSecondary && (
								<p className='break-word line-clamp-[8] whitespace-pre-wrap text-sm [overflow-wrap:anywhere]'>
									{highlightedSecondary}
								</p>
							)
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
								<TooltipContent>{freshnessTierInfo.tooltip}</TooltipContent>
							</Tooltip>
						) : (
							<span className={`font-semibold ${freshnessTierColor}`}>
								{freshnessTierInfo.label}
							</span>
						)}
						{/* Last reviewed */}
						{entity.last_reviewed_at && (
							<>
								<span className='font-bold'>·</span>
								<Tooltip>
									<TooltipTrigger
										render={
											<span className='flex items-center gap-1 font-semibold'>
												<span>{`Reviewed ${lastReviewed.text}`}</span>
												{entity.last_review_rating ? (
													<span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground text-muted-foreground'>
														{getRatingIcon(entity.last_review_rating)}
													</span>
												) : null}
											</span>
										}
									/>
									<TooltipContent>{lastReviewedDate}</TooltipContent>
								</Tooltip>
							</>
						)}
						{/* Durability */}
						<span className='font-bold'>·</span>
						<Tooltip>
							<TooltipTrigger
								render={
									<div className='flex items-center gap-1 font-semibold text-muted-foreground'>
										<Anvil className='h-3 w-3' />
										<span>{stabilityText}</span>
									</div>
								}
							/>
							<TooltipContent>
								Durable for {stabilityTooltipText} without review
							</TooltipContent>
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
					<TooltipContent>
						{config.getRelationsLabel(config.getRelationsCount(entity))}
					</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	)
}
