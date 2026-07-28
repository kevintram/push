import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { ContentColumn } from '~/components/ContentColumn'
import { Button } from '~/components/ui'
import { useCreateReview } from '~/modules/reviews/api/createReview'
import { reviewQueries } from '~/modules/reviews/api/queries'
import { Review as ReviewComponent } from '~/modules/reviews/components/Review'
import { colors } from '~/styles/colors.stylex'
import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	page: { gap: spacing.xl, display: 'flex', flexDirection: 'column' },
	actions: { display: 'flex', justifyContent: 'flex-end' },
	message: { color: colors.textSecondary },
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})

export function ReviewCardPageReviews() {
	const { reviewCardId } = useParams({
		from: '/review-cards/$reviewCardId',
	})
	const { data: reviews } = useSuspenseQuery(
		reviewQueries.list({ reviewCardId, order: 'desc' }),
	)
	const {
		isPending: isCreating,
		mutate: createReview,
		variables: createReviewVariables,
	} = useCreateReview()

	return (
		<ContentColumn xstyle={styles.page}>
			<div {...stylex.props(styles.actions)}>
				<Button
					disabled={isCreating}
					onClick={() => createReview({ reviewCardId })}
				>
					<Plus aria-hidden='true' />
					Review
				</Button>
			</div>
			{reviews.length === 0 && !isCreating ? (
				<p {...stylex.props(styles.message)}>No reviews yet.</p>
			) : null}
			{reviews.length > 0 || isCreating ? (
				<div {...stylex.props(styles.list)}>
					{isCreating &&
					createReviewVariables?.reviewCardId === reviewCardId ? (
						<p
							aria-disabled='true'
							{...stylex.props(styles.message)}
						>
							Creating review…
						</p>
					) : null}
					{reviews.map(review => (
						<ReviewComponent key={review.id} review={review} />
					))}
				</div>
			) : null}
		</ContentColumn>
	)
}
