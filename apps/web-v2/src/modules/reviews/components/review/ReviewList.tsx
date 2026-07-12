import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

import type { Review } from '../../types/review.types'
import { Review as ReviewComponent } from './Review'

const styles = stylex.create({
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})

export function ReviewList({ reviews }: { reviews: Array<Review> }) {
	return (
		<div {...stylex.props(styles.list)}>
			{reviews.map(review => (
				<ReviewComponent key={review.id} review={review} />
			))}
		</div>
	)
}
