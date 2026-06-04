import type { ComponentProps, MouseEventHandler } from 'react'
import type { Button } from '~/components/ui/button'
import type { ReviewListItem } from '~/modules/reviews/types/review.types'

export interface ReviewsMenuProps {
	reviewCardId: number
	align?: 'start' | 'center' | 'end'
	buttonClassName?: string
	buttonSize?: NonNullable<ComponentProps<typeof Button>['size']>
	buttonVariant?: NonNullable<ComponentProps<typeof Button>['variant']>
	disabled?: boolean
	onCompletedReviewCreated?: () => void
	onSeeAll?: () => void
	onTriggerClick?: MouseEventHandler<HTMLButtonElement>
	onTriggerFocus?: ComponentProps<typeof Button>['onFocus']
	onTriggerKeyDown?: ComponentProps<typeof Button>['onKeyDown']
	onTriggerMouseEnter?: MouseEventHandler<HTMLButtonElement>
	reviews?: Array<ReviewListItem>
	compactTriggerBadges?: boolean
	hasLastReviewed?: boolean
	surfaceContext?: 'default' | 'primary'
	triggerCounts?: {
		pendingCount: number
		overdueCount: number
		dueTodayCount: number
	}
}
