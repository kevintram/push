import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'

import { layout, spacing } from '~/styles/tokens.stylex'

import { reviewQueries } from '../../api/reviewQueries'
import { Review } from '../Review'
import { ReviewComposer } from '../ReviewComposer'

const styles = stylex.create({
	container: {
		overflow: 'auto',
		blockSize: '100%',
		display: 'flex',
		justifyContent: 'center',
		minWidth: 0,
		width: '100%',
	},
	content: {
		gap: spacing.xl,
		marginInline: spacing.lg,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		marginBlockStart: spacing.xl,
		maxWidth: layout.contentColumnMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})

type CardReviewsProps = {
	cardId: Id<'cards'>
}

export function CardReviews({ cardId }: CardReviewsProps) {
	const { data: reviews } = useSuspenseQuery(reviewQueries.listByCard(cardId))

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<ReviewComposer />
				<div {...stylex.props(styles.list)}>
					{reviews.map(review => (
						<Review key={review._id} review={review} />
					))}
				</div>
			</div>
		</div>
	)
}
