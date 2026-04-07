import { Plus } from 'lucide-react'
import type { KeyboardEvent, MouseEvent } from 'react'
import {
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger
} from '~/components/ui/dropdown-menu'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import type { ReviewListItem } from '~/features/reviews/types/review.types'
import { ReviewItem } from '../ReviewItem'
import {
	getOptionIcon,
	type ReviewRatingState,
	type ratingOptions
} from '../reviewRatingOptions'
import type { ReviewsMenuProps } from './shared'

type RatingOption = (typeof ratingOptions)[number]

type ReviewsMenuContentProps = {
	align: NonNullable<ReviewsMenuProps['align']>
	completedOptions: Array<RatingOption>
	createReviewPending: boolean
	dueReviews: Array<ReviewListItem>
	handleNestedOverlayOpenChange: (open: boolean) => void
	handleRatingSelect: (ratingState: ReviewRatingState) => void
	handleReviewItemClick: (reviewId: number) => void
	handleSeeAll: () => void
	hasReviewSummarySections: boolean
	latestCompletedReview: ReviewListItem | null
	markDeferredStructuralInvalidation: () => void
	markNestedOverlayIntent: () => void
	shouldRenderSummaryLoadingState: boolean
	stopMenuEventPropagation: (
		event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>
	) => void
	uncompletedOption: RatingOption | null
	uncompletedUnscheduledReviews: Array<ReviewListItem>
	upcomingReviews: Array<ReviewListItem>
}

function ReviewsMenuSection({
	label,
	entries,
	handleNestedOverlayOpenChange,
	handleReviewItemClick,
	markDeferredStructuralInvalidation,
	markNestedOverlayIntent
}: {
	label: string
	entries: Array<ReviewListItem>
	handleNestedOverlayOpenChange: (open: boolean) => void
	handleReviewItemClick: (reviewId: number) => void
	markDeferredStructuralInvalidation: () => void
	markNestedOverlayIntent: () => void
}) {
	if (entries.length === 0) return null

	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuGroup>
				<DropdownMenuLabel>{label}</DropdownMenuLabel>
				{entries.map(review => (
					<div className='px-1' key={review.id}>
						<ReviewItem
							deferStructuralInvalidation={true}
							entry={review}
							onDeferredInvalidation={markDeferredStructuralInvalidation}
							onNestedOverlayOpenChange={handleNestedOverlayOpenChange}
							onNestedOverlayTriggerInteract={markNestedOverlayIntent}
							onReviewClick={handleReviewItemClick}
							showCardColumn={false}
							variant='default'
						/>
					</div>
				))}
			</DropdownMenuGroup>
		</>
	)
}

export function ReviewsMenuContent({
	align,
	completedOptions,
	createReviewPending,
	dueReviews,
	handleNestedOverlayOpenChange,
	handleRatingSelect,
	handleReviewItemClick,
	handleSeeAll,
	hasReviewSummarySections,
	latestCompletedReview,
	markDeferredStructuralInvalidation,
	markNestedOverlayIntent,
	shouldRenderSummaryLoadingState,
	stopMenuEventPropagation,
	uncompletedOption,
	uncompletedUnscheduledReviews,
	upcomingReviews
}: ReviewsMenuContentProps) {
	return (
		<DropdownMenuContent
			align={align}
			className={
				hasReviewSummarySections
					? 'w-[18rem] max-w-[calc(100vw-2rem)]'
					: 'max-w-[calc(100vw-2rem)]'
			}
			matchTriggerWidth={false}
			onClick={stopMenuEventPropagation}
			onKeyDown={stopMenuEventPropagation}
		>
			<DropdownMenuSub>
				<DropdownMenuSubTrigger disabled={createReviewPending}>
					<Plus className='h-4 w-4' />
					Create new
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent>
					{uncompletedOption ? (
						<DropdownMenuItem
							disabled={createReviewPending}
							onClick={() => handleRatingSelect(uncompletedOption.value)}
						>
							<div className='grid w-full grid-cols-[auto_1fr] items-center gap-x-2'>
								{getOptionIcon(uncompletedOption.value)}
								<span>{uncompletedOption.label}</span>
								<span className='col-start-2 text-muted-foreground/70 text-xs'>
									For later
								</span>
							</div>
						</DropdownMenuItem>
					) : null}
					<DropdownMenuSeparator />
					{completedOptions.map(option => (
						<DropdownMenuItem
							disabled={createReviewPending}
							key={option.value}
							onClick={() => handleRatingSelect(option.value)}
						>
							<div className='grid w-full grid-cols-[auto_1fr] items-center gap-x-2'>
								{getOptionIcon(option.value)}
								<span>{option.label}</span>
							</div>
						</DropdownMenuItem>
					))}
				</DropdownMenuSubContent>
			</DropdownMenuSub>

			{shouldRenderSummaryLoadingState ? (
				<>
					<DropdownMenuSeparator />
					<LoadingSpinner containerClassName='min-h-12 py-3' size='sm' />
				</>
			) : null}

			<ReviewsMenuSection
				entries={dueReviews}
				handleNestedOverlayOpenChange={handleNestedOverlayOpenChange}
				handleReviewItemClick={handleReviewItemClick}
				label='Due'
				markDeferredStructuralInvalidation={markDeferredStructuralInvalidation}
				markNestedOverlayIntent={markNestedOverlayIntent}
			/>

			<ReviewsMenuSection
				entries={uncompletedUnscheduledReviews}
				handleNestedOverlayOpenChange={handleNestedOverlayOpenChange}
				handleReviewItemClick={handleReviewItemClick}
				label='Unscheduled'
				markDeferredStructuralInvalidation={markDeferredStructuralInvalidation}
				markNestedOverlayIntent={markNestedOverlayIntent}
			/>

			<ReviewsMenuSection
				entries={upcomingReviews}
				handleNestedOverlayOpenChange={handleNestedOverlayOpenChange}
				handleReviewItemClick={handleReviewItemClick}
				label='Scheduled'
				markDeferredStructuralInvalidation={markDeferredStructuralInvalidation}
				markNestedOverlayIntent={markNestedOverlayIntent}
			/>

			<ReviewsMenuSection
				entries={latestCompletedReview ? [latestCompletedReview] : []}
				handleNestedOverlayOpenChange={handleNestedOverlayOpenChange}
				handleReviewItemClick={handleReviewItemClick}
				label='Last reviewed'
				markDeferredStructuralInvalidation={markDeferredStructuralInvalidation}
				markNestedOverlayIntent={markNestedOverlayIntent}
			/>

			<DropdownMenuSeparator />
			<DropdownMenuItem onClick={handleSeeAll}>
				<span className='font-medium'>See all</span>
			</DropdownMenuItem>
		</DropdownMenuContent>
	)
}
