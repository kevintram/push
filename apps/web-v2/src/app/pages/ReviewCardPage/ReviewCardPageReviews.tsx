import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Button } from '~/components/ui'
import { reviewQueries } from '~/modules/reviews/api/queries'
import { Review as ReviewComponent } from '~/modules/reviews/components/Review'
import { colors, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	page: { gap: spacing.xl, display: 'flex', flexDirection: 'column' },
	actions: { display: 'flex', justifyContent: 'flex-end' },
	message: { color: colors.mutedForeground },
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})

export function ReviewCardPageReviews() {
	const { reviewCardId } = useParams({
		from: '/library/$topicId_/$reviewCardId',
	})
	const {
		data: reviews,
		isError,
		isPending,
	} = useQuery(reviewQueries.list({ reviewCardId, order: 'desc' }))

	return (
		<div {...stylex.props(styles.page)}>
			<div {...stylex.props(styles.actions)}>
				<Button>
					<Plus />
					Review
				</Button>
			</div>
			{isPending ? (
				<p {...stylex.props(styles.message)}>Loading reviews…</p>
			) : null}
			{isError ? (
				<p {...stylex.props(styles.message)}>Unable to load reviews.</p>
			) : null}
			{!isPending && !isError && reviews?.length === 0 ? (
				<p {...stylex.props(styles.message)}>No reviews yet.</p>
			) : null}
			{reviews && reviews.length > 0 ? (
				<div {...stylex.props(styles.list)}>
					{reviews.map(review => (
						<ReviewComponent key={review.id} review={review} />
					))}
				</div>
			) : null}
		</div>
	)
}
