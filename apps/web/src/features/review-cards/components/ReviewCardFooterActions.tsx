import { Flag, MoreHorizontal, Sunset, Trash2, X } from 'lucide-react'
import type { MouseEvent } from 'react'

import { Button } from '~/components/ui/button'
import { CardFooter } from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { ReviewsMenu } from '../../reviews/components/reviews-menu/ReviewsMenu'
import type { ReviewCard as ReviewCardModel } from '../types/review-card.types'
import { FLAGGED_ICON_CLASSNAME } from './reviewCardShared'

type ReviewCardFooterActionsProps = {
	isFlagged: boolean
	isRemovingFromTab: boolean
	isUpdatingReviewCard: boolean
	onOpenDeleteDialog: () => void
	onRemoveFromTab?: () => void
	onSeeReviews: () => void
	onToggleFlag: (event: MouseEvent) => void
	onToggleRetired: (event: MouseEvent) => void
	onTriggerReviewsPrefetch: () => void
	removeFromTabLabel: string
	reviewCard: ReviewCardModel
}

export function ReviewCardFooterActions({
	isFlagged,
	isRemovingFromTab,
	isUpdatingReviewCard,
	onOpenDeleteDialog,
	onRemoveFromTab,
	onSeeReviews,
	onToggleFlag,
	onToggleRetired,
	onTriggerReviewsPrefetch,
	removeFromTabLabel,
	reviewCard
}: ReviewCardFooterActionsProps) {
	const iconButtonClassName = isUpdatingReviewCard
		? 'rounded-full opacity-50'
		: 'rounded-full'

	return (
		<CardFooter className='-mx-1 mt-3 -mb-1 gap-2 px-0'>
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
					pendingCount: reviewCard.reviews_pending_count ?? 0,
					overdueCount: reviewCard.reviews_overdue_count ?? 0,
					dueTodayCount: reviewCard.reviews_due_today_count ?? 0
				}}
			/>
			<div className='flex-1' />
			<div className='flex items-center gap-0.5'>
				<Button
					aria-label={isFlagged ? 'Unflag this item' : 'Flag this item'}
					aria-pressed={isFlagged}
					className={iconButtonClassName}
					onClick={onToggleFlag}
					onKeyDown={event => event.stopPropagation()}
					size='icon-xs'
					variant='ghost'
				>
					<Flag
						className={
							isFlagged ? FLAGGED_ICON_CLASSNAME : 'text-muted-foreground'
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
					className={iconButtonClassName}
					onClick={onToggleRetired}
					onKeyDown={event => event.stopPropagation()}
					size='icon-xs'
					variant='ghost'
				>
					{reviewCard.retired ? (
						<Sunset className='text-orange-500' />
					) : (
						<Sunset className='text-muted-foreground' />
					)}
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								className={iconButtonClassName}
								onClick={event => event.stopPropagation()}
								onKeyDown={event => event.stopPropagation()}
								size='icon-xs'
								variant='ghost'
							>
								<MoreHorizontal className='text-muted-foreground' />
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
		</CardFooter>
	)
}
