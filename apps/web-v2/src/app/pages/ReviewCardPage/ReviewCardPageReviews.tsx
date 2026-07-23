import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

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
	const { isPending: isCreating, mutate: createReview } = useCreateReview()

	return (
		<div {...stylex.props(styles.page)}>
			<div {...stylex.props(styles.actions)}>
				<Button
					disabled={isCreating}
					onClick={() => createReview({ reviewCardId })}
				>
					<Plus aria-hidden='true' />
					Review
				</Button>
			</div>
			{reviews.length === 0 ? (
				<p {...stylex.props(styles.message)}>No reviews yet.</p>
			) : null}
			{reviews.length > 0 ? (
				<div {...stylex.props(styles.list)}>
					{reviews.map(review => (
						<ReviewComponent key={review.id} review={review} />
					))}
				</div>
			) : null}
		</div>
	)
}
