import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'

import { scrollFade } from '~/styles/scrollFade'
import { layout, spacing } from '~/styles/tokens.stylex'

import { reviewQueries } from '../../api/reviewQueries'
import { ReviewList } from '../ReviewList'

const styles = stylex.create({
	container: {
		overflow: 'auto',
		blockSize: '100%',
		display: 'flex',
		justifyContent: 'center',
		minWidth: 0,
		width: '100%',
	},
	content: {
		gap: spacing.xl,
		marginInline: spacing.lg,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		marginBlockStart: spacing.xl,
		maxWidth: layout.contentColumnMaxWidth,
		minWidth: 0,
		width: '100%',
	},
})

type CardReviewsProps = {
	cardId: Id<'cards'>
}

export function CardReviews({ cardId }: CardReviewsProps) {
	const { data: reviews } = useSuspenseQuery(reviewQueries.listByCard(cardId))

	return (
		<div {...stylex.props(styles.container, scrollFade.y)}>
			<div {...stylex.props(styles.content)}>
				<ReviewList reviews={reviews} />
			</div>
		</div>
	)
}
