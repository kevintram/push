import dayjs from 'dayjs'
import {
	Anvil,
	ArrowLeftRight,
	Brain,
	Flag,
	MoreHorizontal,
	Sparkles,
	Sunset,
	Trash2
} from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'

import { RevealPanel, type RevealPanelTab } from '~/components/RevealPanel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import type { ReviewCardBadge } from '~/features/review-cards/components/reviewCardShared'
import { FLAGGED_ICON_CLASSNAME } from '~/features/review-cards/components/reviewCardShared'
import type { ReviewCard } from '~/features/review-cards/types/review-card.types'
import { ReviewsMenu } from '~/features/reviews/components/reviews-menu/ReviewsMenu'
import type { ReviewListItem } from '~/features/reviews/types/review.types'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { getRatingIcon } from '~/utils/getRatingIcon'
import { EMPTY_BADGE_CLASSNAME } from './shared'

type ReviewCardDetailHomeTabProps = {
	answer: string
	flushAnswer: () => void
	flushPrompt: () => void
	freshnessTierColor: string
	freshnessTierInfo: { label: string; tooltip?: string | null }
	guessAnswerText: string
	handleConvertType: () => Promise<void>
	handleCopyGuessText: () => Promise<void>
	handleCopyRevealText: (textOverride?: string) => Promise<void>
	handleSeeReviews: () => void
	handleUpdateReviewCardFields: (fields: {
		prompt?: string
		answer?: string
		notes?: string
		retired?: boolean
		flagged?: boolean
	}) => void
	hidesSecondary: boolean
	isAnswerEmpty: boolean
	isRevealPanelCopied: boolean
	isRetireDisabled: boolean
	isTypeMutationPending: boolean
	isUpdatingReviewCard: boolean
	isUnreviewed: boolean
	lastReviewed: { text: string }
	latestCompletedReview: ReviewListItem | null
	onAnswerChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
	onOpenDeleteDialog: () => void
	onOpenReviewDialog: (reviewId: number) => void
	onPromptChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
	onRetireToggle: () => void
	prompt: string
	promptTextareaRef: React.RefObject<HTMLTextAreaElement | null>
	resolvedReviews: Array<ReviewListItem>
	revealPanelTab: RevealPanelTab | null
	reviewCard: ReviewCard
	reviewTriggerCounts: {
		unscheduledCount: number
		overdueCount: number
		dueTodayCount: number
	}
	setAnswer: (value: string) => void
	setGuessAnswerText: Dispatch<SetStateAction<string>>
	setRevealPanelTab: Dispatch<SetStateAction<RevealPanelTab | null>>
	stabilityText: string
	statusBadges: Array<ReviewCardBadge>
}

export function ReviewCardDetailHomeTab({
	answer,
	flushAnswer,
	flushPrompt,
	freshnessTierColor,
	freshnessTierInfo,
	guessAnswerText,
	handleConvertType,
	handleCopyGuessText,
	handleCopyRevealText,
	handleSeeReviews,
	handleUpdateReviewCardFields,
	hidesSecondary,
	isAnswerEmpty,
	isRevealPanelCopied,
	isRetireDisabled,
	isTypeMutationPending,
	isUpdatingReviewCard,
	isUnreviewed,
	lastReviewed,
	latestCompletedReview,
	onAnswerChange,
	onOpenDeleteDialog,
	onOpenReviewDialog,
	onPromptChange,
	onRetireToggle,
	prompt,
	promptTextareaRef,
	resolvedReviews,
	revealPanelTab,
	reviewCard,
	reviewTriggerCounts,
	setAnswer,
	setGuessAnswerText,
	setRevealPanelTab,
	stabilityText,
	statusBadges
}: ReviewCardDetailHomeTabProps) {
	return (
		<div className='flex min-h-0 flex-1 flex-col gap-2'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<div className='flex min-w-0 flex-wrap items-center gap-2'>
					<Badge
						className='group/type h-6 rounded-full px-1 text-xs'
						variant='ghost'
					>
						<span className='px-1 font-medium text-xs leading-none'>
							{reviewCard.type === 'practice' ? 'Practice' : 'Flashcard'}
						</span>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										aria-label='Convert type'
										className='pointer-events-none inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full p-0 opacity-0 transition-opacity focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover/type:pointer-events-auto group-hover/type:opacity-100 group-active/type:pointer-events-auto group-active/type:opacity-100'
										disabled={isTypeMutationPending || isUpdatingReviewCard}
										onClick={() => {
											handleConvertType().catch(() => {})
										}}
										size='icon-xs'
										type='button'
										variant='ghost'
									/>
								}
							>
								<ArrowLeftRight className='h-3 w-3' />
							</TooltipTrigger>
							<TooltipContent>
								{reviewCard.type === 'practice'
									? 'Convert to Flashcard'
									: 'Convert to Practice'}
							</TooltipContent>
						</Tooltip>
					</Badge>
				</div>
				<div className='flex flex-wrap items-center justify-end gap-1.5'>
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
			</div>

			<Textarea
				className='!bg-transparent !text-3xl m-0 min-h-0 resize-none overflow-hidden break-words rounded-none border-none p-0 pb-1 font-bold leading-tight shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
				onBlur={flushPrompt}
				onChange={onPromptChange}
				placeholder='Untitled prompt'
				ref={promptTextareaRef}
				spellCheck={false}
				value={prompt}
			/>

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
						{latestCompletedReview ? (
							<>
								<span aria-hidden={true} className='font-bold'>
									·
								</span>
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												className='h-auto gap-1 p-0 font-semibold text-muted-foreground text-sm'
												onClick={() =>
													onOpenReviewDialog(latestCompletedReview.id)
												}
												size='default'
												variant='link'
											>
												<span>{`Reviewed ${lastReviewed.text}`}</span>
												{latestCompletedReview.rating ? (
													<span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground dark:bg-primary'>
														{getRatingIcon(latestCompletedReview.rating)}
													</span>
												) : null}
											</Button>
										}
									/>
									<TooltipContent>
										{formatAbsoluteDate(latestCompletedReview.completed_at)}
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
				<div className='ml-auto flex items-center gap-2 font-semibold text-muted-foreground text-sm'>
					<Tooltip>
						<TooltipTrigger
							render={
								<span>{`Edited ${formatRelativeDate(reviewCard.updated_at).text}`}</span>
							}
						/>
						<TooltipContent>
							{dayjs(reviewCard.updated_at).format('MMM D, YYYY')}
						</TooltipContent>
					</Tooltip>
					<span aria-hidden={true}>·</span>
					<Tooltip>
						<TooltipTrigger
							render={
								<span>{`Created ${formatRelativeDate(reviewCard.inserted_at).text}`}</span>
							}
						/>
						<TooltipContent>
							{dayjs(reviewCard.inserted_at).format('MMM D, YYYY')}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			<div className='my-3 flex flex-wrap items-center justify-between border-y-1 py-2'>
				<div className='flex items-center gap-2'>
					<ReviewsMenu
						align='end'
						buttonClassName='rounded-full'
						buttonSize='sm'
						hasLastReviewed={reviewCard.last_reviewed_at != null}
						onSeeAll={handleSeeReviews}
						reviewCardId={reviewCard.id}
						reviews={resolvedReviews}
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
											flagged: reviewCard.flagged_at == null
										})
									}
									size='icon-sm'
									variant='outline'
								>
									<Flag
										className={
											reviewCard.flagged_at
												? FLAGGED_ICON_CLASSNAME
												: 'h-4 w-4 text-muted-foreground'
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
						<TooltipTrigger render={<span className='inline-flex' />}>
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
									<Sunset className='h-4 w-4 text-orange-500' />
								) : (
									<Sunset className='h-4 w-4 text-muted-foreground' />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{reviewCard.retired
								? 'Show in review queue'
								: 'Hide from review queue'}
						</TooltipContent>
					</Tooltip>
				</div>
				<div className='flex items-center justify-end'>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button size='icon-sm' type='button' variant='ghost'>
									<MoreHorizontal className='h-4 w-4' />
								</Button>
							}
						/>
						<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
							<DropdownMenuItem
								disabled={false}
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

			{hidesSecondary ? (
				<RevealPanel
					className='flex min-h-0 flex-1 flex-col'
					closedContent={
						isAnswerEmpty ? (
							<Badge
								className={`${EMPTY_BADGE_CLASSNAME} pointer-events-none absolute top-2 right-2`}
								variant='outline'
							>
								Empty
							</Badge>
						) : null
					}
					guessValue={guessAnswerText}
					isCopied={isRevealPanelCopied}
					onGuessCopy={handleCopyGuessText}
					onGuessValueChange={setGuessAnswerText}
					onRevealBlur={flushAnswer}
					onRevealCopy={handleCopyRevealText}
					onRevealValueChange={setAnswer}
					onValueChange={setRevealPanelTab}
					revealHelperVariant='autosave'
					revealPlaceholder='Write your answer...'
					revealValue={answer}
					value={revealPanelTab}
					variant='detail'
				/>
			) : (
				<div className='flex min-h-0 flex-1 flex-col'>
					<Textarea
						className='!bg-transparent m-0 min-h-[2lh] resize-none break-words rounded-none border-none p-0 text-base leading-relaxed shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
						onBlur={flushAnswer}
						onChange={onAnswerChange}
						placeholder='Write your answer...'
						spellCheck={false}
						value={answer}
					/>
				</div>
			)}
		</div>
	)
}
