import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { reviewQueries, useCreateReview } from '../api/reviewQueries'
import type { Review as ReviewModel } from '../types/review.types'
import { Review } from './Review'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.xl,
		backgroundColor: colors.bgSurfaceSecondary,
		inlineSize: '320px',
	},
	header: {
		alignItems: 'center',
		display: 'flex',
		paddingBlockEnd: spacing.sm,
	},
	actions: { gap: spacing.sm, alignItems: 'center', display: 'flex' },
	primaryText: { flexBasis: '0', flexGrow: 1, flexShrink: 1 },
	seeAll: {
		textDecoration: 'none',
		color: {
			default: colors.textLink,
			':hover': colors.textLinkHover,
			':active': colors.textLinkActive,
		},
		fontSize: fontSizes.sm,
	},
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})
type ReviewsSidebarProps = {
	reviewCardId: Id<'reviewCards'>
	readOnly?: boolean
	reviews?: ReadonlyArray<ReviewModel>
}

export function ReviewsSidebar({
	reviewCardId,
	readOnly = false,
	reviews: suppliedReviews,
}: ReviewsSidebarProps) {
	const { data: queriedReviews = [] } = useQuery({
		...reviewQueries.listByReviewCard(reviewCardId),
		enabled: suppliedReviews === undefined && !readOnly,
	})
	const reviews = suppliedReviews ?? queriedReviews
	const createReview = useCreateReview()
	const handleCreateReview = useCallback(() => {
		createReview.mutate(
			{ reviewCardId },
			{ onError: () => toast.error('Failed to create review') },
		)
	}, [createReview, reviewCardId])

	return (
		<aside {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.primaryText)}>Reviews</p>
				{readOnly ? null : (
					<div {...stylex.props(styles.actions)}>
						<Link
							to='/review-cards/$reviewCardId/reviews'
							params={{ reviewCardId }}
							{...stylex.props(styles.seeAll)}
						>
							See all
						</Link>
						<Button.Icon
							aria-label='Add review'
							variant='ghost'
							size='micro'
							disabled={createReview.isPending}
							onClick={handleCreateReview}
							shape='round'
						>
							<Plus aria-hidden='true' size={iconSizes.md} />
						</Button.Icon>
					</div>
				)}
			</div>
			<div {...stylex.props(styles.list)}>
				{reviews.map(review => (
					<Review
						key={review._id}
						readOnly={readOnly}
						review={review}
					/>
				))}
			</div>
		</aside>
	)
}
