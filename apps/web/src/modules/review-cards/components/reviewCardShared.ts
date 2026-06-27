import { type StatusBadgeItem } from '~/components/ui/status-badge'

import { type ReviewCardStatusBadge } from '../types/status-badge.types'

export const FLAGGED_ICON_CLASSNAME =
	'fill-current text-sky-500 dark:text-sky-300'

export function toFreshnessTier(
	value: string | null,
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

export function toReviewCardStatusBadge(
	badge: ReviewCardStatusBadge,
	options?: { onOpenReviewDialog?: (reviewId: number) => void },
): StatusBadgeItem {
	const reviewId = badge.review_id
	const handleReviewClick =
		reviewId != null && options?.onOpenReviewDialog
			? () => options.onOpenReviewDialog?.(reviewId)
			: undefined

	return {
		label: badge.label,
		tooltip: badge.tooltip,
		tone: badge.tone,
		onClick: handleReviewClick,
	}
}
