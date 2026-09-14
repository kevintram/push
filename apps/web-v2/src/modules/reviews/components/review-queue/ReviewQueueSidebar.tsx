import * as stylex from '@stylexjs/stylex'

import type { CardTypeFilter } from '~/modules/reviews/components/card-type-filter/cardTypeFilter'
import { CardTypeFilterBadges } from '~/modules/reviews/components/card-type-filter/CardTypeFilterBadges'
import { CardItem } from '~/modules/reviews/components/CardItem'
import type { Card } from '~/modules/reviews/types/review.types'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { reviewQueueColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import { REVIEW_QUEUE_SIDEBAR_ID } from './ReviewQueueToolbar'

type ReviewQueueSidebarProps = {
	cards: ReadonlyArray<Card>
	currentCardId: Card['_id'] | null
	title: string
	today: DateString
	filter: CardTypeFilter
	onCardClick: (cardId: Card['_id']) => void
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
		// TODO: add mobile drawer
		inlineSize: 'clamp(200px, 30%, 320px)',
		minBlockSize: 0,
	},
	header: {
		gap: spacing.sm,
		paddingBlock: spacing.lg,
		paddingInline: spacing.lg,
		alignItems: 'stretch',
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
	},
	titleRow: {
		gap: spacing.sm,
		alignItems: 'baseline',
		display: 'flex',
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
	empty: {
		color: reviewQueueColors.emptyForeground,
		fontSize: fontSizes.sm,
	},
})

export function ReviewQueueSidebar({
	cards,
	currentCardId,
	title,
	today,
	filter,
	onCardClick,
	onFilterChange,
}: ReviewQueueSidebarProps) {
	return (
		<aside
			id={REVIEW_QUEUE_SIDEBAR_ID}
			aria-label={`${title} cards`}
			{...stylex.props(styles.panel)}
		>
			<div {...stylex.props(styles.header)}>
				<h1 {...stylex.props(styles.titleRow)}>
					<span>{title}</span>
					<span aria-hidden='true' {...stylex.props(styles.count)}>
						{cards.length}
					</span>
				</h1>
				<CardTypeFilterBadges
					value={filter}
					onValueChange={onFilterChange}
				/>
			</div>
			<div {...stylex.props(styles.list)}>
				{cards.length === 0 ? (
					<p {...stylex.props(styles.empty)}>No cards.</p>
				) : null}
				{cards.map(card => (
					<CardItem
						key={card._id}
						card={card}
						srs={deriveCardSrsState(card, today)}
						today={today}
						active={card._id === currentCardId}
						onClick={() => onCardClick(card._id)}
						buttonProps={{
							'aria-label': `Select ${card.primaryText.trim() || 'Untitled'}`,
							'aria-current':
								card._id === currentCardId ? 'true' : undefined,
						}}
					/>
				))}
			</div>
		</aside>
	)
}
