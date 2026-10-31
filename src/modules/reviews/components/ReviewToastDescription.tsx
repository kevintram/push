import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import { formatRelativeDate } from '~/utils/date'

import type { Card, Review } from '../types/review.types'
import { ReviewStrength } from './ReviewStrength'

const styles = stylex.create({
	// Centers the strength bars on the text rather than its baseline.
	root: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'inline-flex',
		flexWrap: 'wrap',
	},
})

type ReviewToastDescriptionProps = {
	review: Review
	/** The reviewed card, as scheduled by the review. */
	card: Card
}

/** When a reviewed card is due next, and how the review changed its strength. */
export function ReviewToastDescription({
	review,
	card,
}: ReviewToastDescriptionProps) {
	// The server only sends `DateString`s.
	const dueDate = (card.dueDate as DateString | undefined) ?? null
	// Mid-sentence, so "Tomorrow" reads "tomorrow"; dates keep their capitals.
	const due = formatRelativeDate(dueDate).replace(
		/^(Today|Tomorrow|Yesterday)$/,
		word => word.toLowerCase(),
	)
	return (
		<span {...stylex.props(styles.root)}>
			Due next {due}
			<ReviewStrength review={review} size='micro' />
		</span>
	)
}
