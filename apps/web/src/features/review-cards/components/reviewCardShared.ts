import type { ReactNode } from 'react'

import type { ReviewCardStatusBadge } from '../types/status-badge.types'

export const FLAGGED_ICON_CLASSNAME =
	'fill-current text-sky-500 dark:text-sky-300'

export interface ReviewCardBadge {
	label: string
	icon?: ReactNode
	tooltip?: string | null
	className?: string
	onClick?: () => void
	variant?:
		| 'default'
		| 'secondary'
		| 'destructive'
		| 'warning'
		| 'outline'
		| 'ghost'
		| 'link'
}

const STATUS_BADGE_CLASSNAMES: Record<ReviewCardStatusBadge['tone'], string> = {
	danger:
		'h-5 border-transparent bg-rose-200 text-rose-900 text-xs dark:bg-rose-950 dark:text-rose-200',
	info: 'h-5 border border-blue-300 bg-blue-100 text-blue-900 text-xs dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200',
	neutral:
		'h-5 border border-zinc-300 bg-zinc-100 text-zinc-900 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
	warning:
		'h-5 border-transparent bg-amber-100 text-amber-900 text-xs dark:bg-amber-950 dark:text-amber-200'
}

export function toFreshnessTier(
	value: string | null
): 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten' | null {
	if (
		value === 'Fresh' ||
		value === 'Fine' ||
		value === 'Hazy' ||
		value === 'Forgotten'
	) {
		return value
	}

	return null
}

export function toReviewCardBadge(
	badge: ReviewCardStatusBadge,
	options?: { onOpenReviewDialog?: (reviewId: number) => void }
): ReviewCardBadge {
	const reviewId = badge.review_id
	const handleReviewClick =
		reviewId != null && options?.onOpenReviewDialog
			? () => options.onOpenReviewDialog?.(reviewId)
			: undefined

	return {
		label: badge.label,
		tooltip: badge.tooltip,
		className: STATUS_BADGE_CLASSNAMES[badge.tone],
		variant: badge.tone === 'danger' ? 'destructive' : 'outline',
		onClick: handleReviewClick
	}
}
