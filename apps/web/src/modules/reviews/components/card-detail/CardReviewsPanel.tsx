import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { reviewQueries } from '../../api/reviewQueries'
import { Review } from '../Review'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.xl,
		backgroundColor: semanticColors.surfaceSecondary,
		display: 'block',
		flexShrink: 0,
	},
	header: {
		alignItems: 'center',
		display: 'flex',
		paddingBlockEnd: spacing.sm,
	},
	actions: { gap: spacing.sm, alignItems: 'center', display: 'flex' },
	primaryText: {
		margin: 0,
		color: semanticColors.textSecondary,
		flexBasis: '0',
		flexGrow: 1,
		flexShrink: 1,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.medium,
	},
	seeAll: {
		textDecoration: 'none',
		color: {
			default: semanticColors.textInteractive,
			':hover': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
		},
		fontSize: fontSizes.sm,
	},
	list: { gap: spacing.md, display: 'flex', flexDirection: 'column' },
})
type CardReviewsPanelProps = {
	cardId: Id<'cards'>
}

export function CardReviewsPanel({ cardId }: CardReviewsPanelProps) {
	const { data: reviews } = useSuspenseQuery(reviewQueries.listByCard(cardId))

	return (
		<section aria-label='Reviews' {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.header)}>
				<p {...stylex.props(styles.primaryText)}>Reviews</p>
				<div {...stylex.props(styles.actions)}>
					<Link
						to='/cards/$cardId/reviews'
						params={{ cardId }}
						{...stylex.props(styles.seeAll)}
					>
						See all
					</Link>
				</div>
			</div>
			<div {...stylex.props(styles.list)}>
				{reviews.map(review => (
					<Review key={review._id} review={review} />
				))}
			</div>
		</section>
	)
}
