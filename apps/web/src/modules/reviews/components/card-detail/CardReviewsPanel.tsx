import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { SidebarPanel } from '~/components/SidebarPanel'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, spacing } from '~/styles/tokens.stylex'

import { reviewQueries } from '../../api/reviewQueries'
import { ReviewList } from '../ReviewList'

const styles = stylex.create({
	container: {
		flexShrink: 0,
	},
	// Spaced and padded like a stacked review row, so the link reads as the
	// list's next item. Flex sizes the footer to the link's line instead of
	// the panel's larger body text.
	footer: {
		paddingBlock: spacing.xs,
		display: 'flex',
		justifyContent: 'center',
		marginBlockStart: spacing.md,
	},
	seeAll: {
		textDecoration: 'none',
		color: {
			default: colorsSemantic.textInteractive,
			':hover': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
		},
		fontSize: fontSizes.sm,
	},
	seeAllButton: {
		padding: 0,
		borderWidth: 0,
		backgroundColor: 'transparent',
		cursor: 'pointer',
		fontFamily: 'inherit',
	},
})

const REVIEW_LIMIT = 3

type CardReviewsPanelProps = {
	cardId: Id<'cards'>
	/**
	 * Shows all reviews without leaving the current view. When omitted,
	 * "See all" links to the card's reviews route.
	 */
	onSeeAll?: () => void
}

export function CardReviewsPanel({ cardId, onSeeAll }: CardReviewsPanelProps) {
	const { data: reviews } = useSuspenseQuery(reviewQueries.listByCard(cardId))
	// The query sorts undated reviews first, so skip them to show the most
	// recent dated ones.
	const recentReviews = reviews
		.filter(review => review.date !== undefined)
		.slice(0, REVIEW_LIMIT)
	const hasMore = reviews.length > recentReviews.length

	return (
		<SidebarPanel title='Reviews' xstyle={styles.container}>
			<ReviewList reviews={recentReviews} />
			{hasMore && (
				<div {...stylex.props(styles.footer)}>
					{onSeeAll ? (
						<button
							type='button'
							onClick={onSeeAll}
							{...stylex.props(
								styles.seeAll,
								styles.seeAllButton,
							)}
						>
							See all
						</button>
					) : (
						<Link
							to='/cards/$cardId/reviews'
							params={{ cardId }}
							{...stylex.props(styles.seeAll)}
						>
							See all
						</Link>
					)}
				</div>
			)}
		</SidebarPanel>
	)
}
