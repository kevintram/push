import {
	DropdownMenu,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

import { ReviewsMenuContent } from './ReviewsMenuContent'
import { ReviewsMenuTrigger } from './ReviewsMenuTrigger'
import { type ReviewsMenuProps } from './shared'
import { useReviewsMenu } from './useReviewsMenu'

export function ReviewsMenu({
	align = 'end',
	buttonClassName,
	buttonSize = 'sm',
	buttonVariant = 'default',
	disabled = false,
	onCompletedReviewCreated,
	onSeeAll,
	onTriggerClick,
	onTriggerFocus,
	onTriggerKeyDown,
	onTriggerMouseEnter,
	reviews,
	surfaceContext,
	compactTriggerBadges = false,
	hasLastReviewed = false,
	triggerCounts,
	reviewCardId,
}: ReviewsMenuProps) {
	const menu = useReviewsMenu({
		align,
		compactTriggerBadges,
		hasLastReviewed,
		onCompletedReviewCreated,
		onSeeAll,
		reviewCardId,
		reviews,
		triggerCounts,
	})

	return (
		<DropdownMenu
			onOpenChange={menu.handleMenuOpenChange}
			open={menu.isOpen}
		>
			<DropdownMenuTrigger
				render={
					<ReviewsMenuTrigger
						buttonClassName={buttonClassName}
						buttonSize={buttonSize}
						buttonVariant={buttonVariant}
						createReviewPending={menu.createReviewPending}
						disabled={disabled}
						dueTodayCount={menu.dueTodayCount}
						onTriggerClick={onTriggerClick}
						onTriggerFocus={onTriggerFocus}
						onTriggerKeyDown={onTriggerKeyDown}
						onTriggerMouseEnter={onTriggerMouseEnter}
						overdueCount={menu.overdueCount}
						pendingCount={menu.pendingCount}
						surfaceContext={surfaceContext}
						triggerDotSize={menu.triggerDotSize}
					/>
				}
			/>
			<ReviewsMenuContent
				align={menu.align}
				completedOptions={menu.completedOptions}
				createReviewPending={menu.createReviewPending}
				dueReviews={menu.dueReviews}
				handleNestedOverlayOpenChange={
					menu.handleNestedOverlayOpenChange
				}
				handleRatingSelect={menu.handleRatingSelect}
				handleReviewItemClick={menu.handleReviewItemClick}
				handleSeeAll={menu.handleSeeAll}
				hasReviewSummarySections={menu.hasReviewSummarySections}
				latestCompletedReview={menu.latestCompletedReview}
				markDeferredStructuralInvalidation={
					menu.markDeferredStructuralInvalidation
				}
				markNestedOverlayIntent={menu.markNestedOverlayIntent}
				shouldRenderSummaryLoadingState={
					menu.shouldRenderSummaryLoadingState
				}
				stopMenuEventPropagation={menu.stopMenuEventPropagation}
				uncompletedOption={menu.uncompletedOption}
				uncompletedUnscheduledReviews={
					menu.uncompletedUnscheduledReviews
				}
				upcomingReviews={menu.upcomingReviews}
			/>
		</DropdownMenu>
	)
}
