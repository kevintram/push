import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui'
import { reviewsSidebarColors } from '~/styles/componentColors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { reviewQueries, useCreateReview } from '../api/reviewQueries'
import { Review } from './Review'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.xl,
		backgroundColor: reviewsSidebarColors.containerBackground,
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
			default: reviewsSidebarColors.seeAllForeground,
			':hover': reviewsSidebarColors.seeAllForegroundHover,
			':active': reviewsSidebarColors.seeAllForegroundPressed,
		},
		fontSize: fontSizes.sm,
	},
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})
type ReviewsSidebarProps = {
	reviewCardId: Id<'reviewCards'>
}

export function ReviewsSidebar({ reviewCardId }: ReviewsSidebarProps) {
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
		<aside {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.primaryText)}>Reviews</p>
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
			</div>
			<div {...stylex.props(styles.list)}>
				{reviews.map(review => (
					<Review key={review._id} review={review} />
				))}
			</div>
		</aside>
	)
}
