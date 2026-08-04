import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Button } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { reviewQueries } from '../api/reviewQueries'
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
export function ReviewsSidebar() {
	const { reviewCardId } = useParams({ from: '/review-cards/$reviewCardId' })
	const { data: reviews } = useSuspenseQuery(
		reviewQueries.listByReviewCard(reviewCardId),
	)

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
						disabled
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
