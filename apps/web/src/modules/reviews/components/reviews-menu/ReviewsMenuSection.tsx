import {
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu'
import { type ReviewListItem } from '~/modules/reviews/types/review.types'

import { ReviewItem } from '../ReviewItem'

export function ReviewsMenuSection({
	label,
	entries,
	handleNestedOverlayOpenChange,
	handleReviewItemClick,
	markDeferredStructuralInvalidation,
	markNestedOverlayIntent,
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
							onDeferredInvalidation={
								markDeferredStructuralInvalidation
							}
							onNestedOverlayOpenChange={
								handleNestedOverlayOpenChange
							}
							onNestedOverlayTriggerInteract={
								markNestedOverlayIntent
							}
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
