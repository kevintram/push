import { ChevronDown, Loader2 } from 'lucide-react'
import { type ComponentProps, type MouseEvent } from 'react'

import { Button } from '~/components/ui/button'
import { ReviewStatusDots } from '~/components/ui/review-status-dots'

import { type ReviewsMenuProps } from './shared'

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
	| 'surfaceContext'
> & {
	createReviewPending: boolean
	dueTodayCount: number
	overdueCount: number
	pendingCount: number
	triggerDotSize: 'compact' | 'default'
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
	pendingCount,
	surfaceContext,
	triggerDotSize,
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
			{createReviewPending ? <Loader2 className='animate-spin' /> : null}
			<span>Reviews</span>
			<ReviewStatusDots
				className='pointer-events-none'
				dueTodayCount={dueTodayCount}
				overdueCount={overdueCount}
				pendingCount={pendingCount}
				size={triggerDotSize}
				surfaceContext={surfaceContext}
				testIdPrefix='reviews-trigger'
			/>
			<ChevronDown />
		</Button>
	)
}
