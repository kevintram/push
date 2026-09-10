import * as stylex from '@stylexjs/stylex'

import { CardItem } from '~/modules/reviews/components/CardItem'
import type { Card } from '~/modules/reviews/types/review.types'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { reviewQueueColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

type ReviewQueueSidebarProps = {
	cards: ReadonlyArray<Card>
	title: string
	today: DateString
}

const styles = stylex.create({
	panel: {
		borderRadius: radii.lg,
		overflow: 'hidden',
		backgroundColor: reviewQueueColors.sidebarBackground,
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		inlineSize: '360px',
		minBlockSize: 0,
	},
	header: {
		paddingBlock: spacing.lg,
		paddingInline: spacing.lg,
		flexShrink: 0,
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.semibold,
	},
	list: {
		paddingInline: spacing.lg,
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: 0,
		overflowY: 'auto',
	},
	empty: {
		color: reviewQueueColors.emptyForeground,
		fontSize: fontSizes.sm,
	},
})

export function ReviewQueueSidebar({
	cards,
	title,
	today,
}: ReviewQueueSidebarProps) {
	return (
		<aside aria-label={`${title} cards`} {...stylex.props(styles.panel)}>
			<h1 {...stylex.props(styles.header)}>{title}</h1>
			<div {...stylex.props(styles.list)}>
				{cards.length === 0 ? (
					<p {...stylex.props(styles.empty)}>
						No {title.toLowerCase()} cards.
					</p>
				) : null}
				{cards.map(card => (
					<CardItem
						key={card._id}
						card={card}
						srs={deriveCardSrsState(card, today)}
						today={today}
					/>
				))}
			</div>
		</aside>
	)
}
