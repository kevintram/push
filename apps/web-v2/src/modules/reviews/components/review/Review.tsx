import * as stylex from '@stylexjs/stylex'
import { Check, CheckCheck, Circle, Construction, X } from 'lucide-react'

import type { Review as ReviewModel } from '../../types/review.types'

const styles = stylex.create({
	container: {
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gridTemplateRows: 'auto auto',

		alignItems: 'center',
	},
	rating: {
		gridColumn: '1',
		gridRow: '1',
	},
	description: {
		gridColumn: '2',
		gridRow: '1',
	},
	footer: {
		gridColumn: '2',
		gridRow: '2',
	},
})

const ratingDetails = {
	miss: { label: 'Miss', Icon: X },
	hard: { label: 'Hard', Icon: Construction },
	good: { label: 'Good', Icon: Check },
	easy: { label: 'Easy', Icon: CheckCheck },
} as const

function formatDate(value: string | null) {
	if (value === null) return 'Unscheduled'
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${value}T00:00:00Z`))
}

export function Review({ review }: { review: ReviewModel }) {
	const rating = review.rating === null ? null : ratingDetails[review.rating]
	const RatingIcon = rating?.Icon ?? Circle
	const description = review.description.trim()
	const stabilityAfter =
		review.stability_after === null
			? null
			: Math.round(review.stability_after)
	const stabilityDelta =
		review.stability_before === null || review.stability_after === null
			? null
			: Math.round(review.stability_after - review.stability_before)
	const effectiveDate = review.completed_at ?? review.scheduled_at
	const stabilityChange =
		stabilityAfter === null
			? null
			: stabilityDelta === null
				? `${stabilityAfter}d (new)`
				: `${stabilityAfter}d (${stabilityDelta >= 0 ? '+' : ''}${stabilityDelta})`

	return (
		<div {...stylex.props(styles.container)}>
			<div
				aria-label={rating?.label ?? 'Uncompleted'}
				{...stylex.props(styles.rating)}
			>
				<RatingIcon aria-hidden='true' />
			</div>
			<div {...stylex.props(styles.description)}>
				{description || 'No description'}
			</div>
			<div {...stylex.props(styles.footer)}>
				{formatDate(effectiveDate)}
				{stabilityChange ? ` · ${stabilityChange}` : null}
			</div>
		</div>
	)
}
