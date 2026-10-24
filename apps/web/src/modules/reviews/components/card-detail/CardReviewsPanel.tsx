import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { SidebarPanel } from '~/components/SidebarPanel'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes } from '~/styles/tokens.stylex'

import { reviewQueries } from '../../api/reviewQueries'
import { ReviewList } from '../ReviewList'

const styles = stylex.create({
	container: {
		flexShrink: 0,
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
})
type CardReviewsPanelProps = {
	cardId: Id<'cards'>
}

export function CardReviewsPanel({ cardId }: CardReviewsPanelProps) {
	const { data: reviews } = useSuspenseQuery(reviewQueries.listByCard(cardId))

	return (
		<SidebarPanel
			title='Reviews'
			actions={
				<Link
					to='/cards/$cardId/reviews'
					params={{ cardId }}
					{...stylex.props(styles.seeAll)}
				>
					See all
				</Link>
			}
			xstyle={styles.container}
		>
			<ReviewList reviews={reviews} />
		</SidebarPanel>
	)
}
