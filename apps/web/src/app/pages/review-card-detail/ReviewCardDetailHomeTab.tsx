import {
	Anvil,
	ArrowLeftRight,
	Brain,
	Flag,
	MoreHorizontal,
	Sparkles,
	Sunset,
	Trash2,
} from 'lucide-react'
import { type Dispatch, type SetStateAction } from 'react'

import { RevealPanel, type RevealPanelTab } from '~/components/RevealPanel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
	type StatusBadgeItem,
	StatusBadgeList,
} from '~/components/ui/status-badge'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { useRevealPanel } from '~/hooks/useRevealPanel'
import { cn } from '~/lib/utils'
import { FLAGGED_ICON_CLASSNAME } from '~/modules/review-cards/components/reviewCardShared'
import { type ReviewCard } from '~/modules/review-cards/types/review-card.types'
import {
	getReviewCardPrimaryFieldLabel,
	getReviewCardSecondaryFieldLabel,
} from '~/modules/review-cards/utils/reviewCardCopy'
import { ReviewsMenu } from '~/modules/reviews/components/reviews-menu/ReviewsMenu'
import { type ReviewListItem } from '~/modules/reviews/types/review.types'
import { formatAbsoluteDate } from '~/utils/formatRelativeDate'
import { getRatingIcon } from '~/utils/getRatingIcon'

import { EMPTY_BADGE_CLASSNAME } from './shared'

type ReviewCardDetailHomeTabProps = {
	secondaryText: string
	flushPrimaryText: () => void
	flushNotes: () => void
	flushSecondaryText: () => void
	freshnessTierColor: string
	freshnessTierInfo: { label: string; tooltip?: string | null }
	guessSecondaryText: string
	handleConvertType: () => Promise<void>
	handleCopyGuessText: () => Promise<void>
	handleCopyRevealText: (textOverride?: string) => Promise<void>
	handleSeeReviews: () => void
	handleUpdateReviewCardFields: (fields: {
		primary_text?: string
		secondary_text?: string
		notes?: string
		retired?: boolean
		flagged?: boolean
	}) => void
	hidesSecondary: boolean
	isRevealPanelCopied: boolean
	isRetireDisabled: boolean
	isTypeMutationPending: boolean
	isUpdatingReviewCard: boolean
	isUnreviewed: boolean
	lastReviewed: { text: string }
	latestCompletedReview: ReviewListItem | null
	notes: string
	onPrimaryTextChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
	onNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
	onCompletedReviewCreated?: () => void
	onOpenDeleteDialog: () => void
	onOpenReviewDialog: (reviewId: number) => void
	onSecondaryTextChange: (
		event: React.ChangeEvent<HTMLTextAreaElement>,
	) => void
	onRetireToggle: () => void
	primaryText: string
	primaryTextTextareaRef: React.RefObject<HTMLTextAreaElement | null>
	resolvedReviews: Array<ReviewListItem>
	revealPanelTab: RevealPanelTab | null
	reviewCard: ReviewCard
	reviewTriggerCounts: {
		pendingCount: number
		overdueCount: number
		dueTodayCount: number
	}
	setSecondaryText: (value: string) => void
	setNotes: (value: string) => void
	setGuessSecondaryText: Dispatch<SetStateAction<string>>
	setRevealPanelTab: Dispatch<SetStateAction<RevealPanelTab | null>>
	stabilityText: string
	statusBadges: Array<StatusBadgeItem>
}

export function ReviewCardDetailHomeTab({
	secondaryText,
	flushPrimaryText,
	flushNotes,
	flushSecondaryText,
	freshnessTierColor,
	freshnessTierInfo,
	guessSecondaryText,
	handleConvertType,
	handleCopyGuessText,
	handleCopyRevealText,
	handleSeeReviews,
	handleUpdateReviewCardFields,
	hidesSecondary,
	isRevealPanelCopied,
	isRetireDisabled,
	isTypeMutationPending,
	isUpdatingReviewCard,
	isUnreviewed,
	lastReviewed,
	latestCompletedReview,
	notes,
	onPrimaryTextChange,
	onNotesChange,
	onCompletedReviewCreated,
	onOpenDeleteDialog,
	onOpenReviewDialog,
	onSecondaryTextChange,
	onRetireToggle,
	primaryText,
	primaryTextTextareaRef,
	resolvedReviews,
	revealPanelTab,
	reviewCard,
	reviewTriggerCounts,
	setSecondaryText,
	setNotes,
	setGuessSecondaryText,
	setRevealPanelTab,
	stabilityText,
	statusBadges,
}: ReviewCardDetailHomeTabProps) {
	const hidesSecondaryText = hidesSecondary && reviewCard.type !== 'practice'
	const isSecondaryTextEmpty = secondaryText.trim().length === 0
	const reviewedAt =
		latestCompletedReview?.completed_at ?? reviewCard.last_reviewed_at
	const primaryTextLabel = getReviewCardPrimaryFieldLabel(reviewCard.type)
	const secondaryTextLabel = getReviewCardSecondaryFieldLabel(reviewCard.type)
	const {
		revealPanelTab: notesRevealPanelTab,
		setRevealPanelTab: setNotesRevealPanelTab,
		guessText: guessNotesText,
		setGuessText: setGuessNotesText,
		isCopied: isNotesRevealPanelCopied,
		handleCopyGuessText: handleCopyNotesGuessText,
		handleCopyRevealText: handleCopyNotesRevealText,
	} = useRevealPanel({
		revealText: notes,
		entityId: reviewCard.id < 0 ? null : reviewCard.id * 10_000 + 1,
		hidesSecondary,
	})

	return (
		<div
			className={cn(
				'flex flex-col gap-2',
				hidesSecondary && 'min-h-0 flex-1',
			)}
		>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div className='flex min-w-0 flex-wrap items-center gap-2'>
					<Badge
						className='group/type h-6 rounded-full px-1 text-xs'
						variant='ghost'
					>
						<span className='px-1 font-medium text-xs leading-none'>
							{reviewCard.type === 'practice'
								? 'Practice'
								: 'Flashcard'}
						</span>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										aria-label='Convert type'
										className='pointer-events-none cursor-pointer rounded-full opacity-0 transition-opacity focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/type:pointer-events-auto group-hover/type:opacity-100 group-active/type:pointer-events-auto group-active/type:opacity-100'
										disabled={
											isTypeMutationPending ||
											isUpdatingReviewCard
										}
										onClick={() => {
											handleConvertType().catch(() => {})
										}}
										size='icon-xs'
										type='button'
										variant='ghost'
									/>
								}
							>
								<ArrowLeftRight className='size-3.5' />
							</TooltipTrigger>
							<TooltipContent>
								{reviewCard.type === 'practice'
									? 'Convert to Flashcard'
									: 'Convert to Practice'}
							</TooltipContent>
						</Tooltip>
					</Badge>
				</div>
				<StatusBadgeList
					badges={statusBadges}
					className='justify-end'
				/>
			</div>

			<Textarea
				className='!bg-transparent !text-lg min-h-0 resize-none overflow-hidden break-words rounded-none border-none p-0 font-semibold leading-tight shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
				onBlur={flushPrimaryText}
				onChange={onPrimaryTextChange}
				placeholder={primaryTextLabel}
				ref={primaryTextTextareaRef}
				spellCheck={false}
				value={primaryText}
			/>

			{hidesSecondaryText ? (
				<RevealPanel
					className='!flex-none'
					closedContent={
						isSecondaryTextEmpty ? (
							<Badge
								className={`${EMPTY_BADGE_CLASSNAME} pointer-events-none absolute top-2 right-2`}
								variant='outline'
							>
								Empty
							</Badge>
						) : null
					}
					guessValue={guessSecondaryText}
					isCopied={isRevealPanelCopied}
					onGuessCopy={handleCopyGuessText}
					onGuessValueChange={setGuessSecondaryText}
					onRevealBlur={flushSecondaryText}
					onRevealCopy={handleCopyRevealText}
					onRevealValueChange={setSecondaryText}
					onValueChange={setRevealPanelTab}
					revealHelperVariant='autosave'
					revealPlaceholder={secondaryTextLabel}
					revealValue={secondaryText}
					value={revealPanelTab}
					variant='detail'
				/>
			) : (
				<div className='flex-none'>
					<Textarea
						className='!bg-transparent m-0 min-h-[2lh] resize-none break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
						onBlur={flushSecondaryText}
						onChange={onSecondaryTextChange}
						placeholder={secondaryTextLabel}
						spellCheck={false}
						value={secondaryText}
					/>
				</div>
			)}

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
							<TooltipContent>
								{freshnessTierInfo.tooltip ??
									'Complete a review to see freshness tier'}
							</TooltipContent>
						</Tooltip>
						{reviewedAt ? (
							<>
								<span aria-hidden={true} className='font-bold'>
									·
								</span>
								<Tooltip>
									<TooltipTrigger
										render={
											latestCompletedReview ? (
												<Button
													className='h-auto gap-1 p-0 font-semibold text-muted-foreground text-sm'
													onClick={() =>
														onOpenReviewDialog(
															latestCompletedReview.id,
														)
													}
													size='default'
													variant='link'
												>
													<span>{`Last reviewed ${lastReviewed.text}`}</span>
													{latestCompletedReview.rating ? (
														<span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground dark:bg-primary'>
															{getRatingIcon(
																latestCompletedReview.rating,
															)}
														</span>
													) : null}
												</Button>
											) : (
												<div className='flex items-center gap-1 font-semibold text-muted-foreground text-sm'>
													<span>{`Last reviewed ${lastReviewed.text}`}</span>
												</div>
											)
										}
									/>
									<TooltipContent>
										{formatAbsoluteDate(reviewedAt)}
									</TooltipContent>
								</Tooltip>
							</>
						) : null}
						<span className='font-bold'>·</span>
						<Tooltip>
							<TooltipTrigger
								render={
									<div className='flex items-center gap-1.5 font-semibold text-muted-foreground'>
										<Anvil className='h-4 w-4' />
										<span>{`${stabilityText} durability`}</span>
									</div>
								}
							/>
							<TooltipContent>
								Lasts {stabilityText} before getting hazy
							</TooltipContent>
						</Tooltip>
					</>
				)}
				<div className='ml-auto flex items-center gap-1.5'>
					<ReviewsMenu
						align='end'
						buttonClassName='rounded-full'
						buttonSize='sm'
						hasLastReviewed={reviewCard.last_reviewed_at != null}
						onCompletedReviewCreated={onCompletedReviewCreated}
						onSeeAll={handleSeeReviews}
						reviewCardId={reviewCard.id}
						reviews={resolvedReviews}
						surfaceContext='primary'
						triggerCounts={reviewTriggerCounts}
					/>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									aria-label={
										reviewCard.flagged_at
											? 'Unflag this item'
											: 'Flag this item'
									}
									aria-pressed={reviewCard.flagged_at != null}
									className='rounded-full'
									disabled={isUpdatingReviewCard}
									onClick={() =>
										handleUpdateReviewCardFields({
											flagged:
												reviewCard.flagged_at == null,
										})
									}
									size='icon-sm'
									variant='outline'
								>
									<Flag
										className={
											reviewCard.flagged_at
												? FLAGGED_ICON_CLASSNAME
												: 'text-muted-foreground'
										}
									/>
								</Button>
							}
						/>
						<TooltipContent>
							{reviewCard.flagged_at ? 'Unflag' : 'Flag'}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={<span className='inline-flex' />}
						>
							<Button
								aria-label={
									reviewCard.retired
										? 'Return this item to review queue'
										: 'Retire this item'
								}
								aria-pressed={reviewCard.retired}
								className='rounded-full'
								disabled={isRetireDisabled}
								onClick={onRetireToggle}
								size='icon-sm'
								variant='outline'
							>
								{reviewCard.retired ? (
									<Sunset className='text-orange-500' />
								) : (
									<Sunset className='text-muted-foreground' />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{reviewCard.retired
								? 'Return to review queue'
								: 'Retire'}
						</TooltipContent>
					</Tooltip>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									className='rounded-full'
									size='icon-sm'
									type='button'
									variant='outline'
								>
									<MoreHorizontal />
								</Button>
							}
						/>
						<DropdownMenuContent
							align='end'
							side='bottom'
							sideOffset={4}
						>
							<DropdownMenuItem
								onClick={onOpenDeleteDialog}
								variant='destructive'
							>
								<Trash2 className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div
				className={cn(
					'mt-0.5 mb-2 flex flex-col border-t pt-1',
					hidesSecondary && 'min-h-0 flex-1',
				)}
			>
				<div
					className={cn(
						'flex flex-col gap-2',
						hidesSecondary && 'min-h-0 flex-1',
					)}
				>
					<h2 className='font-semibold text-muted-foreground text-sm'>
						Notes
					</h2>
					{hidesSecondary ? (
						<RevealPanel
							className='!flex-1'
							guessValue={guessNotesText}
							isCopied={isNotesRevealPanelCopied}
							onGuessCopy={handleCopyNotesGuessText}
							onGuessValueChange={setGuessNotesText}
							onRevealBlur={flushNotes}
							onRevealCopy={handleCopyNotesRevealText}
							onRevealValueChange={setNotes}
							onValueChange={setNotesRevealPanelTab}
							revealHelperVariant='autosave'
							revealPlaceholder='Add notes...'
							revealValue={notes}
							value={notesRevealPanelTab}
							variant='detail'
						/>
					) : (
						<Textarea
							className='!bg-transparent m-0 min-h-[2lh] resize-none break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
							onBlur={flushNotes}
							onChange={onNotesChange}
							placeholder='Add notes...'
							spellCheck={false}
							value={notes}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
