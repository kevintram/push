import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { reviewQueries } from '~/modules/reviews/api/reviewQueries'
import { Review } from '~/modules/reviews/components/Review'
import { ReviewComposer } from '~/modules/reviews/components/ReviewComposer'
import { layout, spacing } from '~/styles/tokens.stylex'

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

export function ReviewCardPageReviews() {
	const { reviewCardId } = useParams({ from: '/review-cards/$reviewCardId' })

	const { data: reviews } = useSuspenseQuery(
		reviewQueries.listByReviewCard(reviewCardId),
	)
	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<ReviewComposer reviewCardId={reviewCardId} />
				<div {...stylex.props(styles.list)}>
					{reviews.map(review => (
						<Review key={review._id} review={review} />
					))}
				</div>
			</div>
		</div>
	)
}
