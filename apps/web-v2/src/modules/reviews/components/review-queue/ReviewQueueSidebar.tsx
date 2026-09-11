import * as stylex from '@stylexjs/stylex'

import type { CardTypeFilter } from '~/modules/reviews/components/card-type-filter/cardTypeFilter'
import { CardTypeFilterBadges } from '~/modules/reviews/components/card-type-filter/CardTypeFilterBadges'
import { CardItemLink } from '~/modules/reviews/components/CardItemLink'
import type { Card } from '~/modules/reviews/types/review.types'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { reviewQueueColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

type ReviewQueueSidebarProps = {
	cards: ReadonlyArray<Card>
	title: string
	today: DateString
	filter: CardTypeFilter
	onFilterChange: (filter: CardTypeFilter) => void
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
		gap: spacing.sm,
		paddingBlock: spacing.lg,
		paddingInline: spacing.lg,
		alignItems: 'baseline',
		display: 'flex',
		flexShrink: 0,
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.semibold,
	},
	count: {
		color: reviewQueueColors.positionForeground,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.regular,
		insetBlockStart: '-1px',
		position: 'relative',
	},
	list: {
		paddingInline: spacing.lg,
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: 0,
		overflowY: 'auto',
	},
	filters: {
		paddingInline: spacing.lg,
		paddingBlockEnd: spacing.sm,
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
	filter,
	onFilterChange,
}: ReviewQueueSidebarProps) {
	return (
		<aside aria-label={`${title} cards`} {...stylex.props(styles.panel)}>
			<h1 {...stylex.props(styles.header)}>
				<span>{title}</span>
				<span aria-hidden='true' {...stylex.props(styles.count)}>
					{cards.length}
				</span>
			</h1>
			<CardTypeFilterBadges
				value={filter}
				onValueChange={onFilterChange}
				xstyle={styles.filters}
			/>
			<div {...stylex.props(styles.list)}>
				{cards.length === 0 ? (
					<p {...stylex.props(styles.empty)}>No cards.</p>
				) : null}
				{cards.map(card => (
					<CardItemLink
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
