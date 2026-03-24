import { Flag, MoreHorizontal, Sunset, Trash2, User2, X } from 'lucide-react'
import type { MouseEvent } from 'react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { CardHeader } from '~/components/ui/card'
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
import { ReviewsMenu } from '../../reviews/components/reviews-menu/ReviewsMenu'
import type { ReviewCard as ReviewCardModel } from '../types/review-card.types'
import {
	FLAGGED_ICON_CLASSNAME,
	type ReviewCardBadge
} from './reviewCardShared'

export function ReviewCardStatusRow({
	badges
}: {
	badges: Array<ReviewCardBadge>
}) {
	if (badges.length === 0) return null

	return (
		<div className='pointer-events-none absolute top-[0.5px] right-3 z-5 flex max-w-[calc(100%-1.5rem)] -translate-y-1/2 flex-wrap items-center justify-end gap-1.5'>
			{badges.map((badge, index) => (
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
	)
}

type ReviewCardHeaderProps = {
	deleteDisabled: boolean
	hideParent: boolean
	isFlagged: boolean
	isRemovingFromTab: boolean
	isUpdatingReviewCard: boolean
	onOpenDeleteDialog: () => void
	onRemoveFromTab?: () => void
	onSeeReviews: () => void
	onToggleFlag: (event: MouseEvent) => void
	onToggleFlagFromMenu: () => void
	onToggleRetired: (event: MouseEvent) => void
	onTriggerReviewsPrefetch: () => void
	removeFromTabLabel: string
	resolvedParentLabel: string
	reviewCard: ReviewCardModel
}

export function ReviewCardHeader({
	deleteDisabled,
	hideParent,
	isFlagged,
	isRemovingFromTab,
	isUpdatingReviewCard,
	onOpenDeleteDialog,
	onRemoveFromTab,
	onSeeReviews,
	onToggleFlag,
	onToggleFlagFromMenu,
	onToggleRetired,
	onTriggerReviewsPrefetch,
	removeFromTabLabel,
	resolvedParentLabel,
	reviewCard
}: ReviewCardHeaderProps) {
	return (
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
				<ReviewsMenu
					align='end'
					buttonClassName='rounded-full'
					buttonSize='xs'
					buttonVariant='tertiary'
					compactTriggerBadges={true}
					hasLastReviewed={reviewCard.last_reviewed_at != null}
					onSeeAll={onSeeReviews}
					onTriggerClick={event => event.stopPropagation()}
					onTriggerFocus={onTriggerReviewsPrefetch}
					onTriggerKeyDown={event => event.stopPropagation()}
					onTriggerMouseEnter={onTriggerReviewsPrefetch}
					reviewCardId={reviewCard.id}
					triggerCounts={{
						unscheduledCount:
							reviewCard.reviews_unscheduled_uncompleted_count ?? 0,
						overdueCount: reviewCard.reviews_overdue_count ?? 0,
						dueTodayCount: reviewCard.reviews_due_today_count ?? 0
					}}
				/>
				<Button
					aria-label={isFlagged ? 'Unflag this item' : 'Flag this item'}
					aria-pressed={isFlagged}
					className={isUpdatingReviewCard ? 'opacity-50' : ''}
					onClick={onToggleFlag}
					onKeyDown={event => event.stopPropagation()}
					size='icon-sm'
					variant='ghost'
				>
					<Flag
						className={
							isFlagged
								? FLAGGED_ICON_CLASSNAME
								: 'h-4 w-4 text-muted-foreground'
						}
					/>
				</Button>
				<Button
					aria-label={
						reviewCard.retired
							? 'Return this item to review queue'
							: 'Retire this item'
					}
					aria-pressed={reviewCard.retired}
					className={isUpdatingReviewCard ? 'opacity-50' : ''}
					onClick={onToggleRetired}
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
							disabled={isUpdatingReviewCard}
							onClick={event => {
								event.stopPropagation()
								onToggleFlagFromMenu()
							}}
						>
							<Flag className='mr-2 h-4 w-4' />
							{isFlagged ? 'Unflag' : 'Flag'}
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={deleteDisabled}
							onClick={event => {
								event.stopPropagation()
								onOpenDeleteDialog()
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
	)
}
