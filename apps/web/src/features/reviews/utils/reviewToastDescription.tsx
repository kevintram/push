import { Anvil } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Review } from '../types/review.types'

type ReviewDurabilityFields = Pick<
	Review,
	'stability_before' | 'stability_after'
>

export function getReviewCreatedToastDescription(
	review: ReviewDurabilityFields
): ReactNode | undefined {
	if (review.stability_before == null || review.stability_after == null) {
		return
	}

	const stabilityAfterRounded = Math.round(review.stability_after)
	const stabilityDeltaRounded = Math.round(
		review.stability_after - review.stability_before
	)
	const stabilityDeltaColorClass =
		stabilityDeltaRounded >= 0
			? 'text-green-600 dark:text-green-400'
			: 'text-red-600 dark:text-red-400'

	return (
		<span className='inline-flex items-center gap-1'>
			<Anvil className='h-3.5 w-3.5' />
			<span>{stabilityAfterRounded}d</span>
			<span className={stabilityDeltaColorClass}>
				({stabilityDeltaRounded >= 0 ? '+' : ''}
				{stabilityDeltaRounded})
			</span>
		</span>
	)
}
