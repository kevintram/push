import { useQueryClient } from '@tanstack/react-query'
import {
	Anvil,
	Archive,
	ArchiveRestore,
	Baby,
	Brain,
	ChevronDown,
	Inbox,
	Loader2,
	MoreHorizontal,
	Plus,
	Sparkles,
	Star,
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { useLearnableMetrics } from '~/hooks/useLearnableMetrics'
import { useResizeObserver } from '~/hooks/useResizeObserver'
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
import { useDeleteNote } from '../api/deleteNote'
import { getNote } from '../api/getNote'
import { noteKeys } from '../api/queryKeys'
import { useUpdateNote } from '../api/updateNote'
import type { Note, NoteStatusBadge, NoteTag } from '../types/note.types'
import { orderNoteStatusBadges } from '../utils/orderNoteStatusBadges'

const MIN_HEIGHT = 96
const CARD_WIDTH_REVIEWED_META_MIN = 0
const CARD_WIDTH_RATING_META_MIN = 0
const CARD_WIDTH_STABILITY_META_MIN = 300
const TAG_ORDER = ['TOPIC', 'SOURCE', 'PRACTICE'] as const

export interface NoteCardStatusBadge {
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

const NOTE_STATUS_BADGE_CLASSNAMES: Record<NoteStatusBadge['tone'], string> = {
	danger:
		'h-5 border-transparent bg-rose-200 text-rose-900 text-xs dark:bg-red-950 dark:text-red-200',
	info: 'h-5 border border-blue-300 bg-blue-100 text-blue-900 text-xs dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200',
	neutral:
		'h-5 border border-zinc-300 bg-zinc-100 text-zinc-900 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
	warning:
		'h-5 border-transparent bg-amber-100 text-amber-900 text-xs dark:bg-amber-950 dark:text-amber-200'
}

export function toNoteCardStatusBadge(
	badge: NoteStatusBadge,
	options?: { onOpenReviewDialog?: (reviewId: number) => void }
): NoteCardStatusBadge {
	const reviewId = badge.review_id
	const handleReviewClick =
		reviewId != null && options?.onOpenReviewDialog
			? () => options.onOpenReviewDialog?.(reviewId)
			: undefined

	return {
		label: badge.label,
		tooltip: badge.tooltip,
		className: NOTE_STATUS_BADGE_CLASSNAMES[badge.tone],
		variant: badge.tone === 'danger' ? 'destructive' : 'outline',
		onClick: handleReviewClick
	}
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

function normalizeTags(tags: Array<NoteTag>): Array<NoteTag> {
	return [...tags].sort((a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b))
}

function toTypeBadgeLabel(tags: Array<NoteTag>): string {
	if (tags.length === 0) return 'Note'
	return normalizeTags(tags)
		.map(tag => {
			if (tag === 'TOPIC') return 'Topic'
			if (tag === 'SOURCE') return 'Source'
			return 'Practice'
		})
		.join(', ')
}

interface NoteCardProps {
	note: Note
	onClick?: () => void
	minHeight?: number
	searchQuery?: string
	statusBadges?: Array<NoteCardStatusBadge>
	onRemoveFromTab?: () => void
	removeFromTabLabel?: string
	isRemovingFromTab?: boolean
}

export function NoteCard({
	note,
	onClick,
	minHeight = MIN_HEIGHT,
	searchQuery,
	statusBadges,
	onRemoveFromTab,
	removeFromTabLabel = 'Remove from tab',
	isRemovingFromTab = false
}: NoteCardProps) {
	const [cardRef, cardRect] = useResizeObserver<HTMLDivElement>()
	const queryClient = useQueryClient()
	const { mutate: updateNote, isPending: isUpdatingNote } = useUpdateNote()
	const deleteNoteMutation = useDeleteNote()

	const metrics = useLearnableMetrics({
		retrievability: note.retrievability,
		freshness_tier: toFreshnessTier(note.freshness_tier),
		days_until_next_tier: note.days_until_next_tier,
		stability: note.stability,
		last_reviewed_at: note.last_reviewed_at,
		inherited_stability: null,
		srs_enabled: note.srs_enabled
	})

	const { freshnessTierInfo, freshnessTierColor, isUnreviewed, stabilityText } =
		metrics

	const { hidesPrimary, hidesSecondary } = useFlashcardMode()
	const hideParent = hidesPrimary && note.parent_id != null
	const [isPrimaryRevealed, setIsPrimaryRevealed] = useState(!hidesPrimary)
	const [isSecondaryRevealed, setIsSecondaryRevealed] = useState(
		!hidesSecondary
	)

	const lastReviewed = useMemo(
		() =>
			formatRelativeDate(note.last_reviewed_at, {
				includeFuture: false,
				nullLabel: 'never'
			}),
		[note.last_reviewed_at]
	)
	const lastReviewedDate = useMemo(
		() => formatAbsoluteDate(note.last_reviewed_at),
		[note.last_reviewed_at]
	)

	const highlightedPrimary = useMemo(() => {
		if (!note.title) return null
		if (!searchQuery?.trim()) return note.title
		return highlightText({ text: note.title, query: searchQuery })
	}, [note.title, searchQuery])

	const highlightedSecondary = useMemo(() => {
		if (!note.body) return null
		if (!searchQuery?.trim()) return note.body
		return truncateWithHighlight(note.body, searchQuery, 200)
	}, [note.body, searchQuery])

	const hasPrimaryText = Boolean(note.title.trim())
	const hasSecondaryText = Boolean(note.body.trim())
	const hidePrimary = hidesPrimary && hasPrimaryText && !isPrimaryRevealed
	const hideSecondary =
		hidesSecondary && hasSecondaryText && !isSecondaryRevealed

	useEffect(() => {
		setIsPrimaryRevealed(!hidesPrimary)
		setIsSecondaryRevealed(!hidesSecondary)
	}, [hidesPrimary, hidesSecondary])

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
			queryKey: noteKeys.detail(note.id),
			queryFn: () => getNote(note.id),
			staleTime: 30_000
		})
	}, [queryClient, note.id])

	const handleSrsToggle = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation()
			updateNote({ id: note.id, srs_enabled: !note.srs_enabled })
		},
		[note.id, note.srs_enabled, updateNote]
	)
	const handleDeleteNote = useCallback(async () => {
		if (deleteNoteMutation.isPending) return
		const confirmed = window.confirm(
			'Delete this note? This action cannot be undone.'
		)
		if (!confirmed) return
		try {
			await deleteNoteMutation.mutateAsync(note.id)
			toast.success('Note deleted')
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Failed to delete note'
			)
		}
	}, [deleteNoteMutation, note.id])

	const handleRevealPrimary = useCallback((event: MouseEvent) => {
		event.stopPropagation()
		setIsPrimaryRevealed(true)
	}, [])
	const handleRevealSecondary = useCallback((event: MouseEvent) => {
		event.stopPropagation()
		setIsSecondaryRevealed(true)
	}, [])

	const createReviewMutation = useCreateReview()
	const isCreatingReview = createReviewMutation.isPending
	const { openReviewDialog } = useReviewDialog()
	const noteStatusBadges = useMemo(
		() =>
			orderNoteStatusBadges(note.status_badges).map(apiBadge =>
				toNoteCardStatusBadge(apiBadge, {
					onOpenReviewDialog: openReviewDialog
				})
			),
		[note.status_badges, openReviewDialog]
	)
	const resolvedStatusBadges = statusBadges ?? noteStatusBadges

	const createReview = useCallback(
		async (completedAt: string | null, rating: Rating | null) => {
			const review = await createReviewMutation.mutateAsync({
				note_id: note.id,
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
		[note.id, createReviewMutation, openReviewDialog]
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
		'pointer-events-none absolute top-[0.5px] right-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-1.5 -translate-y-1/2'

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
					{badge.tooltip && <TooltipContent>{badge.tooltip}</TooltipContent>}
				</Tooltip>
			))}
		</div>
	) : null

	const relationsCount: number = 0
	const typeBadgeLabel = toTypeBadgeLabel(note.tags)
	const parentLabel =
		note.parent_title?.trim() ||
		(note.parent_id != null ? String(note.parent_id) : 'None')
	const hasMeasuredCardWidth = cardRect.width > 0
	const showReviewedMeta =
		!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_REVIEWED_META_MIN
	const showRatingMeta =
		showReviewedMeta &&
		note.last_review_rating != null &&
		(!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_RATING_META_MIN)
	const showStabilityMeta =
		!hasMeasuredCardWidth || cardRect.width >= CARD_WIDTH_STABILITY_META_MIN

	return (
		<Card
			className='relative max-h-96 cursor-pointer gap-0 overflow-visible p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
			onClick={handleActivate}
			onKeyDown={handleKeyDown}
			onMouseEnter={handleMouseEnter}
			ref={cardRef}
			role='button'
			style={{ minHeight: `${minHeight}px` }}
			tabIndex={0}
		>
			{statusRow}
			<CardHeader className='relative flex items-center justify-between gap-2 p-0 pb-1'>
				{!hideParent && (
					<Tooltip>
						<TooltipTrigger
							render={
								<div className='flex min-w-0 items-center gap-1 font-semibold text-muted-foreground text-xs'>
									<User2 className='h-3 w-3 shrink-0' />
									<span className='truncate'>{parentLabel}</span>
								</div>
							}
						/>
						<TooltipContent>{parentLabel}</TooltipContent>
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
							note.srs_enabled
								? 'Disable SRS for this item'
								: 'Enable SRS for this item'
						}
						aria-pressed={note.srs_enabled}
						className={isUpdatingNote ? 'opacity-50' : ''}
						onClick={handleSrsToggle}
						onKeyDown={event => event.stopPropagation()}
						size='icon-sm'
						variant='ghost'
					>
						{note.srs_enabled ? (
							<Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
						) : (
							<Star className='h-4 w-4 text-muted-foreground' />
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
							<DropdownMenuItem
								onClick={event => {
									event.stopPropagation()
									updateNote({
										id: note.id,
										inboxed: !note.inboxed
									})
								}}
							>
								<Inbox className='mr-2 h-4 w-4' />
								{note.inboxed ? 'Remove from Inbox' : 'Inbox'}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={event => {
									event.stopPropagation()
									updateNote({
										id: note.id,
										archived: !note.archived
									})
								}}
							>
								{note.archived ? (
									<>
										<ArchiveRestore className='mr-2 h-4 w-4' />
										Unarchive
									</>
								) : (
									<>
										<Archive className='mr-2 h-4 w-4' />
										Archive
									</>
								)}
							</DropdownMenuItem>
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
								disabled={deleteNoteMutation.isPending}
								onClick={event => {
									event.stopPropagation()
									void handleDeleteNote()
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

			<CardContent className='flex flex-1 flex-col gap-3 p-0'>
				<div className='flex flex-col gap-1'>
					<div className='flex items-center gap-1 text-muted-foreground text-xs'>
						<span>{typeBadgeLabel}</span>
						{note.inboxed && (
							<>
								<span className='font-bold'>·</span>
								<div className='flex items-center gap-1'>
									<Inbox className='h-3 w-3' />
									<span>Inbox</span>
								</div>
							</>
						)}
						{note.archived && (
							<>
								<span className='font-bold'>·</span>
								<div className='flex items-center gap-1'>
									<Archive className='h-3 w-3' />
									<span>Archive</span>
								</div>
							</>
						)}
					</div>

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
										onKeyDown={event => event.stopPropagation()}
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
										onKeyDown={event => event.stopPropagation()}
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
								{note.last_review_rating
									? getRatingIcon(note.last_review_rating)
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
							? '1 child note'
							: `${relationsCount} child notes`}
					</TooltipContent>
				</Tooltip>
			</CardFooter>
		</Card>
	)
}
