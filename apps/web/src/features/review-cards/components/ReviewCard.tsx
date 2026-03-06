import { useQueryClient } from '@tanstack/react-query'
import {
	AlertTriangle,
	Anvil,
	Baby,
	Brain,
	Check,
	ChevronDown,
	Copy,
	Loader2,
	MoreHorizontal,
	Plus,
	Sparkles,
	Sunset,
	Trash2,
	User2,
	X
} from 'lucide-react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { cn } from '~/lib/utils'
import { useFlashcardMode } from '~/stores/FlashcardModeContext'
import { localDateString } from '~/utils/date'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { getRatingIcon } from '~/utils/getRatingIcon'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { useCreateReview } from '../../reviews/api/createReview'
import { RatingDropdown } from '../../reviews/components/RatingDropdown'
import type { ReviewRatingState } from '../../reviews/components/ReviewRatingCheckbox'
import { useReviewDialog } from '../../reviews/hooks/useReviewDialog'
import type { Rating } from '../../reviews/types/review.types'
import {
	getReviewCreatedToastActionLabel,
	getReviewCreatedToastDescription
} from '../../reviews/utils/reviewToastDescription'
import { useDeleteReviewCard } from '../api/deleteReviewCard'
import { getReviewCard } from '../api/getReviewCard'
import { reviewCardKeys } from '../api/queryKeys'
import { useUpdateReviewCard } from '../api/updateReviewCard'
import type { ReviewCard as ReviewCardModel } from '../types/review-card.types'
import type { ReviewCardStatusBadge } from '../types/status-badge.types'
import { orderReviewCardStatusBadges } from '../utils/orderReviewCardStatusBadges'

const MIN_HEIGHT = 96
const CARD_HEIGHT_GUESS_PANEL_MIN = 300
const CARD_WIDTH_REVIEWED_META_MIN = 0
const CARD_WIDTH_RATING_META_MIN = 0
const CARD_WIDTH_STABILITY_META_MIN = 300
const REVEAL_PANEL_TEXTAREA_CLASSNAME =
	'h-full min-h-24 resize-none border-border/70 bg-background/80 text-sm'
const REVEAL_PANEL_COPY_BUTTON_CLASSNAME =
	'absolute right-2 bottom-2 text-muted-foreground hover:text-foreground'

type ReviewCardRevealPanelTab = 'guess' | 'reveal'

function isReviewCardRevealPanelTab(
	value: string
): value is ReviewCardRevealPanelTab {
	return value === 'guess' || value === 'reveal'
}

export interface ReviewCardBadge {
	label: string
	icon?: ReactNode
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

const STATUS_BADGE_CLASSNAMES: Record<ReviewCardStatusBadge['tone'], string> = {
	danger:
		'h-5 border-transparent bg-rose-200 text-rose-900 text-xs dark:bg-red-950 dark:text-red-200',
	info: 'h-5 border border-blue-300 bg-blue-100 text-blue-900 text-xs dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200',
	neutral:
		'h-5 border border-zinc-300 bg-zinc-100 text-zinc-900 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
	warning:
		'h-5 border-transparent bg-amber-100 text-amber-900 text-xs dark:bg-amber-950 dark:text-amber-200'
}

function toFreshnessTier(
	value: string | null
): 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten' | null {
	if (
		value === 'Fresh' ||
		value === 'Fine' ||
		value === 'Hazy' ||
		value === 'Forgotten'
	) {
		return value
	}
	return null
}

export function toReviewCardBadge(
	badge: ReviewCardStatusBadge,
	options?: { onOpenReviewDialog?: (reviewId: number) => void }
): ReviewCardBadge {
	const reviewId = badge.review_id
	const handleReviewClick =
		reviewId != null && options?.onOpenReviewDialog
			? () => options.onOpenReviewDialog?.(reviewId)
			: undefined

	return {
		label: badge.label,
		tooltip: badge.tooltip,
		className: STATUS_BADGE_CLASSNAMES[badge.tone],
		variant: badge.tone === 'danger' ? 'destructive' : 'outline',
		onClick: handleReviewClick
	}
}

interface ReviewCardProps {
	reviewCard: ReviewCardModel
	onClick?: () => void
	minHeight?: number
	searchQuery?: string
	statusBadges?: Array<ReviewCardBadge>
	onRemoveFromTab?: () => void
	removeFromTabLabel?: string
	isRemovingFromTab?: boolean
	parentLabel?: string
	typeLabelOverride?: string
}

export function ReviewCard({
	reviewCard,
	onClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	statusBadges,
	onRemoveFromTab,
	removeFromTabLabel = 'Remove from tab',
	isRemovingFromTab = false,
	parentLabel,
	typeLabelOverride
}: ReviewCardProps) {
	const [cardRef, cardRect] = useResizeObserver<HTMLDivElement>()
	const queryClient = useQueryClient()
	const { mutate: updateReviewCard, isPending: isUpdatingReviewCard } =
		useUpdateReviewCard()
	const deleteReviewCardMutation = useDeleteReviewCard()

	const metrics = useLearnableMetrics({
		retrievability: reviewCard.retrievability,
		freshness_tier: toFreshnessTier(reviewCard.freshness_tier),
		days_until_next_tier: reviewCard.days_until_next_tier,
		stability: reviewCard.stability,
		last_reviewed_at: reviewCard.last_reviewed_at,
		inherited_stability: null
	})

	const { freshnessTierInfo, freshnessTierColor, isUnreviewed, stabilityText } =
		metrics

	const { hidesPrimary, hidesSecondary } = useFlashcardMode()
	const hideParent = hidesPrimary && reviewCard.topic_id != null
	const [isPrimaryRevealed, setIsPrimaryRevealed] = useState(!hidesPrimary)
	const [isSecondaryRevealed, setIsSecondaryRevealed] = useState(
		!hidesSecondary
	)
	const [revealPanelTab, setRevealPanelTab] =
		useState<ReviewCardRevealPanelTab | null>(null)
	const [guessSecondaryText, setGuessSecondaryText] = useState('')
	const [isRevealPanelCopied, setIsRevealPanelCopied] = useState(false)

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(reviewCard.last_reviewed_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[reviewCard.last_reviewed_at]
	)
	const lastReviewedDate = useMemo(
		() => formatAbsoluteDate(reviewCard.last_reviewed_at),
		[reviewCard.last_reviewed_at]
	)

	const highlightedPrimary = useMemo(() => {
		if (!reviewCard.prompt) return null
		if (!searchQuery?.trim()) return reviewCard.prompt
		return highlightText({ text: reviewCard.prompt, query: searchQuery })
	}, [reviewCard.prompt, searchQuery])

	const highlightedSecondary = useMemo(() => {
		if (!reviewCard.answer) return null
		if (!searchQuery?.trim()) return reviewCard.answer
		return truncateWithHighlight(reviewCard.answer, searchQuery, 200)
	}, [reviewCard.answer, searchQuery])

	const hasPrimaryText = Boolean(reviewCard.prompt.trim())
	const hasSecondaryText = Boolean(reviewCard.answer.trim())
	const hidePrimary = hidesPrimary && hasPrimaryText && !isPrimaryRevealed
	const hideSecondary =
		hidesSecondary && hasSecondaryText && !isSecondaryRevealed
	const hasMeasuredCardHeight = cardRect.height > 0
	const effectiveCardHeight = hasMeasuredCardHeight
		? cardRect.height
		: minHeight
	const isLargeCard = effectiveCardHeight >= CARD_HEIGHT_GUESS_PANEL_MIN
	const canUseGuessPanel = hidesSecondary && hasSecondaryText && isLargeCard

	useEffect(() => {
		setIsPrimaryRevealed(!hidesPrimary)
		setIsSecondaryRevealed(!hidesSecondary)
	}, [hidesPrimary, hidesSecondary])
	useEffect(() => {
		if (reviewCard.id < 0) return
		setRevealPanelTab(null)
		setGuessSecondaryText('')
		setIsRevealPanelCopied(false)
	}, [reviewCard.id])
	useEffect(() => {
		if (!hidesSecondary) {
			setRevealPanelTab(null)
			setGuessSecondaryText('')
			setIsRevealPanelCopied(false)
			return
		}
		if (canUseGuessPanel) {
			setRevealPanelTab(null)
			setGuessSecondaryText('')
			setIsRevealPanelCopied(false)
			return
		}
		setRevealPanelTab(null)
		setGuessSecondaryText('')
		setIsRevealPanelCopied(false)
	}, [hidesSecondary, canUseGuessPanel])
	useEffect(() => {
		if (!isRevealPanelCopied) return
		const timeoutId = window.setTimeout(() => {
			setIsRevealPanelCopied(false)
		}, 1500)
		return () => {
			window.clearTimeout(timeoutId)
		}
	}, [isRevealPanelCopied])

	const handleActivate = useCallback(() => {
		onClick?.()
	}, [onClick])

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				onClick?.()
			}
		},
		[onClick]
	)

	const handleMouseEnter = useCallback(() => {
		queryClient.prefetchQuery({
			queryKey: reviewCardKeys.detail(reviewCard.id),
			queryFn: () => getReviewCard(reviewCard.id),
			staleTime: 30_000
		})
	}, [queryClient, reviewCard.id])

	const handleRetiredToggle = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation()
			updateReviewCard({
				id: reviewCard.id,
				retired: !reviewCard.retired
			})
		},
		[reviewCard.id, reviewCard.retired, updateReviewCard]
	)

	const handleDeleteReviewCard = useCallback(async () => {
		if (deleteReviewCardMutation.isPending) return
		const confirmed = window.confirm(
			'Delete this review card? This action cannot be undone.'
		)
		if (!confirmed) return
		try {
			await deleteReviewCardMutation.mutateAsync(reviewCard.id)
			toast.success('Review card deleted')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete review card'
			)
		}
	}, [deleteReviewCardMutation, reviewCard.id])

	const handleRevealPrimary = useCallback((event: MouseEvent) => {
		event.stopPropagation()
		setIsPrimaryRevealed(true)
	}, [])
	const handleRevealSecondary = useCallback((event: MouseEvent) => {
		event.stopPropagation()
		setIsSecondaryRevealed(true)
	}, [])
	const handleRevealPanelTabChange = useCallback((value: string) => {
		if (isReviewCardRevealPanelTab(value)) {
			setRevealPanelTab(value)
		}
	}, [])
	const handleCopyGuessText = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(guessSecondaryText)
			setIsRevealPanelCopied(true)
			toast.success('Guess copied')
		} catch {
			toast.error('Failed to copy guess')
		}
	}, [guessSecondaryText])
	const handleCopyRevealText = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(reviewCard.answer)
			setIsRevealPanelCopied(true)
			toast.success('Reveal copied')
		} catch {
			toast.error('Failed to copy reveal')
		}
	}, [reviewCard.answer])

	const createReviewMutation = useCreateReview()
	const isCreatingReview = createReviewMutation.isPending
	const { openReviewDialog } = useReviewDialog()
	const reviewCardStatusBadges = useMemo(
		() =>
			orderReviewCardStatusBadges(reviewCard.status_badges).map(apiBadge =>
				toReviewCardBadge(apiBadge, {
					onOpenReviewDialog: openReviewDialog
				})
			),
		[reviewCard.status_badges, openReviewDialog]
	)
	const resolvedStatusBadges = statusBadges ?? reviewCardStatusBadges

	const createReview = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			const review = await createReviewMutation.mutateAsync({
				review_card_id: reviewCard.id,
				rating,
				description: '',
				scheduled_at: null,
				completed_at: completedAt
			})

			toast('Review created', {
				description: getReviewCreatedToastDescription(review),
				action: {
					label: getReviewCreatedToastActionLabel(review),
					onClick: () => openReviewDialog(review.id)
				}
			})
		},
		[createReviewMutation, openReviewDialog, reviewCard.id]
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

	const hasStatusBadges = resolvedStatusBadges.length > 0
	const statusRowClassName =
		'pointer-events-none absolute top-[0.5px] right-3 z-5 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-1.5 -translate-y-1/2'

	const statusRow = hasStatusBadges ? (
		<div className={statusRowClassName}>
			{resolvedStatusBadges.map((badge, index) => (
				<Tooltip key={`${badge.label}-${index}`}>
					<TooltipTrigger
						render={
							<Badge
								className={
									badge.className
										? `${badge.className} pointer-events-auto rounded-sm shadow-sm`
										: 'pointer-events-auto h-5 rounded-sm text-xs shadow-sm'
								}
								onClick={event => {
									if (!badge.onClick) return
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
								{badge.icon ? (
									<span className='inline-flex items-center'>{badge.icon}</span>
								) : null}
								{badge.label ? <span>{badge.label}</span> : null}
							</Badge>
						}
					/>
					{badge.tooltip ? (
						<TooltipContent>{badge.tooltip}</TooltipContent>
					) : null}
				</Tooltip>
			))}
		</div>
	) : null

	const typeBadgeLabel =
		typeLabelOverride ??
		(reviewCard.type === 'practice' ? 'Practice' : 'Flashcard')
	const topicTitle = reviewCard.topic_title?.trim() ?? ''
	const resolvedParentLabel =
		parentLabel ??
		(topicTitle.length > 0 ? topicTitle : `Topic #${reviewCard.topic_id}`)
	const relationsCount: number = 0
	const hasMeasuredCardWidth = cardRect.width > 0
	const showReviewedMeta =
		!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_REVIEWED_META_MIN
	const showRatingMeta =
		showReviewedMeta &&
		reviewCard.last_review_rating != null &&
		(!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_RATING_META_MIN)
	const showStabilityMeta =
		!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_STABILITY_META_MIN

	let primaryContent: ReactNode
	if (hidePrimary) {
		primaryContent = (
			<div className='relative'>
				<div
					aria-hidden={true}
					className='break-word invisible line-clamp-5 whitespace-pre-wrap font-semibold leading-tight [overflow-wrap:anywhere]'
				>
					{highlightedPrimary}
				</div>
				<div className='absolute inset-0'>
					<Button
						className='h-full w-full justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2 text-muted-foreground text-sm hover:bg-muted/70'
						onClick={handleRevealPrimary}
						onKeyDown={event => event.stopPropagation()}
						size='default'
						variant='outline'
					>
						Reveal
					</Button>
				</div>
			</div>
		)
	} else if (highlightedPrimary) {
		primaryContent = (
			<h3 className='break-word line-clamp-5 whitespace-pre-wrap font-semibold leading-tight [overflow-wrap:anywhere]'>
				{highlightedPrimary}
			</h3>
		)
	} else {
		primaryContent = null
	}

	let secondaryContent: ReactNode
	if (hideSecondary) {
		if (canUseGuessPanel) {
			secondaryContent =
				revealPanelTab == null ? (
					<div className='relative mt-1 flex h-full min-h-16 w-full flex-1 items-center justify-center rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 px-2.5 py-2'>
						<div className='flex items-center gap-2'>
							<Button
								className='rounded-full'
								onClick={event => {
									event.stopPropagation()
									setRevealPanelTab('guess')
								}}
								size='sm'
								type='button'
								variant='outline'
							>
								Type a guess
							</Button>
							<Button
								className='rounded-full'
								onClick={event => {
									event.stopPropagation()
									setRevealPanelTab('reveal')
								}}
								size='sm'
								type='button'
								variant='outline'
							>
								Reveal
							</Button>
						</div>
					</div>
				) : (
					<div className='mt-1 flex h-full min-h-16 flex-1 flex-col rounded-xl border border-muted-foreground/40 border-dashed bg-muted/40 p-2'>
						<Tabs
							className='flex h-full min-h-0 flex-col gap-2'
							onValueChange={handleRevealPanelTabChange}
							value={revealPanelTab}
						>
							<div className='flex items-start justify-between gap-2'>
								<TabsList
									className='h-8'
									onClick={event => event.stopPropagation()}
									onKeyDown={event => event.stopPropagation()}
									variant='default'
								>
									<TabsTrigger
										className='px-2 text-xs'
										onClick={event => event.stopPropagation()}
										onKeyDown={event => event.stopPropagation()}
										value='guess'
									>
										Guess
									</TabsTrigger>
									<TabsTrigger
										className='px-2 text-xs'
										onClick={event => event.stopPropagation()}
										onKeyDown={event => event.stopPropagation()}
										value='reveal'
									>
										Reveal
									</TabsTrigger>
								</TabsList>
							</div>
							<TabsContent
								className='mt-0 flex min-h-0 flex-1 flex-col'
								value='guess'
							>
								<div className='relative min-h-0 flex-1'>
									<Textarea
										className={REVEAL_PANEL_TEXTAREA_CLASSNAME}
										onChange={event => {
											setGuessSecondaryText(event.target.value)
											if (isRevealPanelCopied) setIsRevealPanelCopied(false)
										}}
										onClick={event => event.stopPropagation()}
										onKeyDown={event => event.stopPropagation()}
										placeholder='Type your guess...'
										spellCheck={false}
										value={guessSecondaryText}
									/>
									<Button
										aria-label='Copy guess text'
										className={REVEAL_PANEL_COPY_BUTTON_CLASSNAME}
										onClick={event => {
											event.stopPropagation()
											handleCopyGuessText().catch(() => {})
										}}
										size='icon-xs'
										type='button'
										variant='ghost'
									>
										{isRevealPanelCopied ? (
											<Check className='h-3 w-3' />
										) : (
											<Copy className='h-3 w-3' />
										)}
									</Button>
								</div>
								<p className='mt-1 flex items-center justify-end gap-1 text-muted-foreground text-xs'>
									<AlertTriangle className='h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400' />
									<span>Guesses are not saved.</span>
								</p>
							</TabsContent>
							<TabsContent
								className='mt-0 flex min-h-0 flex-1 flex-col'
								value='reveal'
							>
								<div className='relative min-h-0 flex-1'>
									<Textarea
										className={REVEAL_PANEL_TEXTAREA_CLASSNAME}
										onClick={event => event.stopPropagation()}
										onKeyDown={event => event.stopPropagation()}
										readOnly={true}
										spellCheck={false}
										value={reviewCard.answer}
									/>
									<Button
										aria-label='Copy reveal text'
										className={REVEAL_PANEL_COPY_BUTTON_CLASSNAME}
										onClick={event => {
											event.stopPropagation()
											handleCopyRevealText().catch(() => {})
										}}
										size='icon-xs'
										type='button'
										variant='ghost'
									>
										{isRevealPanelCopied ? (
											<Check className='h-3 w-3' />
										) : (
											<Copy className='h-3 w-3' />
										)}
									</Button>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				)
		} else {
			secondaryContent = (
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
							onKeyDown={event => event.stopPropagation()}
							size='default'
							variant='outline'
						>
							Reveal
						</Button>
					</div>
				</div>
			)
		}
	} else if (highlightedSecondary) {
		secondaryContent = (
			<p
				className={cn(
					'break-word whitespace-pre-wrap text-sm [overflow-wrap:anywhere]',
					isLargeCard ? 'min-h-0 flex-1 overflow-y-auto' : 'line-clamp-[8]'
				)}
			>
				{highlightedSecondary}
			</p>
		)
	} else {
		secondaryContent = null
	}

	return (
		<Card
			className={cn(
				'relative max-h-96 gap-0 overflow-visible p-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
				onClick ? 'cursor-pointer hover:bg-muted/50' : null
			)}
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			ref={cardRef}
			role={onClick ? 'button' : undefined}
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={onClick ? 0 : undefined}
		>
			{statusRow}
			<CardHeader className='relative flex items-center justify-between gap-2 p-0 pb-1'>
				{hideParent ? null : (
					<Tooltip>
						<TooltipTrigger
							render={
								<div className='flex min-w-0 items-center gap-1 font-semibold text-muted-foreground text-xs'>
									<User2 className='h-3 w-3 shrink-0' />
									<span className='truncate'>{resolvedParentLabel}</span>
								</div>
							}
						/>
						<TooltipContent>{resolvedParentLabel}</TooltipContent>
					</Tooltip>
				)}
				<div className='flex-1' />
				<div className='flex items-center gap-0.5'>
					<RatingDropdown
						align='end'
						onSelect={handleRatingSelect}
						trigger={
							<Button
								className='rounded-full'
								disabled={isCreatingReview}
								onClick={event => event.stopPropagation()}
								onKeyDown={event => event.stopPropagation()}
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
					<Button
						aria-label={
							reviewCard.retired
								? 'Return this item to review queue'
								: 'Retire this item'
						}
						aria-pressed={reviewCard.retired}
						className={isUpdatingReviewCard ? 'opacity-50' : ''}
						onClick={handleRetiredToggle}
						onKeyDown={event => event.stopPropagation()}
						size='icon-sm'
						variant='ghost'
					>
						{reviewCard.retired ? (
							<Sunset className='h-4 w-4 text-orange-500' />
						) : (
							<Sunset className='h-4 w-4 text-muted-foreground' />
						)}
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									className='h-5 w-5 p-0'
									onClick={event => event.stopPropagation()}
									onKeyDown={event => event.stopPropagation()}
									variant='ghost'
								>
									<MoreHorizontal className='h-3 w-3' />
								</Button>
							}
						/>
						<DropdownMenuContent align='end' side='bottom' sideOffset={2}>
							{onRemoveFromTab ? (
								<DropdownMenuItem
									disabled={isRemovingFromTab}
									onClick={event => {
										event.stopPropagation()
										onRemoveFromTab()
									}}
								>
									<X className='mr-2 h-4 w-4' />
									{removeFromTabLabel}
								</DropdownMenuItem>
							) : null}
							<DropdownMenuItem
								disabled={deleteReviewCardMutation.isPending}
								onClick={event => {
									event.stopPropagation()
									handleDeleteReviewCard().catch(() => {})
								}}
								variant='destructive'
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>

			<CardContent className='flex min-h-0 flex-1 flex-col gap-3 p-0'>
				<div className='flex min-h-0 flex-1 flex-col gap-1'>
					<div className='flex items-center gap-1 text-muted-foreground text-xs'>
						<span>{typeBadgeLabel}</span>
					</div>

					<div className='flex min-h-0 flex-1 flex-col gap-2'>
						{primaryContent}
						{secondaryContent}
					</div>
				</div>
			</CardContent>

			<CardFooter className='gap-1 px-0 pt-2 text-muted-foreground text-xs'>
				{isUnreviewed ? (
					<div className='flex items-center gap-1'>
						<Sparkles className='h-3 w-3' />
						<span>Unreviewed</span>
					</div>
				) : (
					<>
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
						{showReviewedMeta ? (
							<>
								<span className='font-bold'>·</span>
								<Tooltip>
									<TooltipTrigger
										render={
											<span className='flex items-center gap-1 font-semibold'>{`Reviewed ${lastReviewed.text}`}</span>
										}
									/>
									<TooltipContent>{lastReviewedDate}</TooltipContent>
								</Tooltip>
							</>
						) : null}
						{showRatingMeta ? (
							<span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground text-muted-foreground'>
								{reviewCard.last_review_rating
									? getRatingIcon(reviewCard.last_review_rating)
									: null}
							</span>
						) : null}
						{showStabilityMeta ? (
							<>
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
										Lasts {stabilityText} before getting hazy
									</TooltipContent>
								</Tooltip>
							</>
						) : null}
					</>
				)}
				<div className='flex-1' />
				<Tooltip>
					<TooltipTrigger
						render={
							<div className='flex items-center gap-1'>
								<Baby className='h-3 w-3' />
								<span>{relationsCount}</span>
							</div>
						}
					/>
					<TooltipContent>
						{relationsCount === 1
							? '1 related card'
							: `${relationsCount} related cards`}
					</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	)
}
