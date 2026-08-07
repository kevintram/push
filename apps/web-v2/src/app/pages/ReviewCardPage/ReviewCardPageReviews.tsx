import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui'
import {
	reviewQueries,
	useCreateReview,
} from '~/modules/reviews/api/reviewQueries'
import { Review } from '~/modules/reviews/components/Review'
import { layout, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		overflow: 'auto',
		display: 'flex',
		justifyContent: 'center',
	},
	content: {
		gap: spacing.xl,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	actions: { display: 'flex', justifyContent: 'flex-end' },
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})

export function ReviewCardPageReviews() {
	const { reviewCardId } = useParams({ from: '/review-cards/$reviewCardId' })

	const { data: reviews } = useSuspenseQuery(
		reviewQueries.listByReviewCard(reviewCardId),
	)
	const createReview = useCreateReview()
	const handleCreateReview = useCallback(() => {
		createReview.mutate(
			{ reviewCardId },
			{ onError: () => toast.error('Failed to create review') },
		)
	}, [createReview, reviewCardId])

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<div {...stylex.props(styles.actions)}>
					<Button
						disabled={createReview.isPending}
						onClick={handleCreateReview}
					>
						<Plus aria-hidden='true' />
						Review
					</Button>
				</div>
				<div {...stylex.props(styles.list)}>
					{reviews.map(review => (
						<Review key={review._id} review={review} />
					))}
				</div>
			</div>
		</div>
	)
}
