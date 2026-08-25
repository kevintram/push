import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { breakpoints, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { ReviewCardSrsState } from '../types/review.types'
import { ReviewCardPropertiesPanel } from './ReviewCardPropertiesPanel'
import { ReviewsPanel } from './ReviewsPanel'

const styles = stylex.create({
	container: {
		gap: spacing.sm,
		display: {
			default: 'none',
			[breakpoints.tablet]: 'flex',
		},
		flexDirection: 'column',
		flexShrink: 0,
		inlineSize: '320px',
		maxBlockSize: '100%',
		minBlockSize: 0,
	},
})

type ReviewCardSidebarProps = ReviewCardSrsState & {
	reviewCardId: Id<'reviewCards'>
	today: DateString
}

export function ReviewCardSidebar({
	reviewCardId,
	today,
	...srsState
}: ReviewCardSidebarProps) {
	return (
		<aside
			aria-label='Review card details'
			{...stylex.props(styles.container)}
		>
			<ReviewCardPropertiesPanel {...srsState} today={today} />
			<ReviewsPanel reviewCardId={reviewCardId} />
		</aside>
	)
}
