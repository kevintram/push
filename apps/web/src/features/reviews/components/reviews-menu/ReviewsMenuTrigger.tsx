import { ChevronDown, Loader2 } from 'lucide-react'
import type { ComponentProps, MouseEvent } from 'react'
import { Button } from '~/components/ui/button'
import { ReviewStatusDots } from '~/components/ui/review-status-dots'
import type { ReviewsMenuProps } from './shared'

type ReviewsMenuTriggerProps = Pick<
	ReviewsMenuProps,
	| 'buttonClassName'
	| 'buttonSize'
	| 'buttonVariant'
	| 'disabled'
	| 'onTriggerClick'
	| 'onTriggerFocus'
	| 'onTriggerKeyDown'
	| 'onTriggerMouseEnter'
> & {
	createReviewPending: boolean
	dueTodayCount: number
	overdueCount: number
	triggerBadgeContext: 'default' | 'primary'
	triggerDotSize: 'compact' | 'default'
	unscheduledCount: number
} & Omit<
		ComponentProps<typeof Button>,
		'children' | 'className' | 'disabled' | 'size' | 'variant'
	>

export function ReviewsMenuTrigger({
	buttonClassName,
	buttonSize = 'sm',
	buttonVariant = 'default',
	createReviewPending,
	disabled = false,
	dueTodayCount,
	onTriggerClick,
	onTriggerFocus,
	onTriggerKeyDown,
	onTriggerMouseEnter,
	overdueCount,
	triggerBadgeContext,
	triggerDotSize,
	unscheduledCount,
	...buttonProps
}: ReviewsMenuTriggerProps) {
	const forwardedOnClick = (
		buttonProps as {
			onClick?: (event: MouseEvent<HTMLButtonElement>) => void
		}
	).onClick
	const mergedOnClick = (event: MouseEvent<HTMLButtonElement>) => {
		forwardedOnClick?.(event)
		onTriggerClick?.(event)
	}

	return (
		<Button
			{...buttonProps}
			className={buttonClassName}
			disabled={disabled || createReviewPending}
			onClick={mergedOnClick}
			onFocus={onTriggerFocus}
			onKeyDown={onTriggerKeyDown}
			onMouseEnter={onTriggerMouseEnter}
			size={buttonSize}
			variant={buttonVariant}
		>
			{createReviewPending ? (
				<Loader2 className='h-4 w-4 animate-spin' />
			) : null}
			<span>Reviews</span>
			<ReviewStatusDots
				className='pointer-events-none'
				dueTodayCount={dueTodayCount}
				overdueCount={overdueCount}
				size={triggerDotSize}
				surface={triggerBadgeContext}
				testIdPrefix='reviews-trigger'
				unscheduledCount={unscheduledCount}
			/>
			<ChevronDown className='h-4 w-4' />
		</Button>
	)
}
