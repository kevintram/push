import dayjs from 'dayjs'
import { Anvil, CalendarDays } from 'lucide-react'
import { type ReactNode } from 'react'

import { type Review } from '../types/review.types'

type ReviewDurabilityFields = Pick<
	Review,
	'stabilityBefore' | 'stabilityAfter' | 'dueAfter'
>

type ReviewToastActionFields = Pick<Review, 'completedAt' | 'scheduledAt'>

export function getReviewCreatedToastActionLabel(
	review: ReviewToastActionFields,
): 'Open' | 'Schedule' {
	return review.completedAt == null && review.scheduledAt == null
		? 'Schedule'
		: 'Open'
}

function formatDueRelative(dueDate: string): string {
	const today = dayjs().startOf('day')
	const due = dayjs(dueDate).startOf('day')
	const diffDays = due.diff(today, 'day')
	const absDays = Math.abs(diffDays)

	if (diffDays === 0) return 'Today'
	if (diffDays === 1) return 'Tomorrow'
	if (diffDays === -1) return 'Yesterday'

	if (absDays <= 7) {
		return diffDays > 0 ? `in ${diffDays}d` : `${absDays}d ago`
	}

	const weeks = Math.max(1, Math.round(absDays / 7))
	return diffDays > 0 ? `in ${weeks}w` : `${weeks}w ago`
}

export function getReviewCreatedToastDescription(
	review: ReviewDurabilityFields,
): ReactNode | undefined {
	const dueLabel = review.dueAfter ? formatDueRelative(review.dueAfter) : null
	const hasStability = review.stabilityAfter != null

	if (!(dueLabel || hasStability)) {
		return
	}

	const stabilityAfterRounded = hasStability
		? Math.round(review.stabilityAfter ?? 0)
		: null
	const hasDelta = hasStability && review.stabilityBefore != null
	const stabilityDeltaRounded =
		hasDelta && review.stabilityBefore != null
			? Math.round((review.stabilityAfter ?? 0) - review.stabilityBefore)
			: 0
	let stabilityDeltaColorClass = 'text-green-600 dark:text-green-400'
	if (hasStability && hasDelta && stabilityDeltaRounded < 0) {
		stabilityDeltaColorClass = 'text-red-600 dark:text-red-400'
	}

	return (
		<span className='inline-flex items-center gap-1'>
			{dueLabel ? (
				<span className='inline-flex items-center gap-1'>
					<CalendarDays className='h-3.5 w-3.5' />
					<span>Due {dueLabel}</span>
				</span>
			) : null}

			{dueLabel && hasStability ? (
				<span className='text-muted-foreground'>•</span>
			) : null}

			{hasStability ? (
				<span className='inline-flex items-center gap-1'>
					<Anvil className='h-3.5 w-3.5' />
					<span>{stabilityAfterRounded}d</span>
					{hasDelta ? (
						<span className={stabilityDeltaColorClass}>
							({stabilityDeltaRounded >= 0 ? '+' : ''}
							{stabilityDeltaRounded})
						</span>
					) : (
						<span className={stabilityDeltaColorClass}>(new)</span>
					)}
				</span>
			) : null}
		</span>
	)
}
