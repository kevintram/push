import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'
import { useId } from 'react'

import { ResizeHandle } from '~/components/ResizeHandle'
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { useResizableWidth } from '~/hooks/useResizableWidth'
import type { CardTypeFilter } from '~/modules/reviews/components/card-type-filter/cardTypeFilter'
import { CardTypeFilterBadges } from '~/modules/reviews/components/card-type-filter/CardTypeFilterBadges'
import { CardItem } from '~/modules/reviews/components/CardItem'
import { CardList } from '~/modules/reviews/components/CardList'
import type { Card } from '~/modules/reviews/types/review.types'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { baseColors } from '~/styles/colors/colorsPrimitive.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import {
	breakpoints,
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import { REVIEW_QUEUE_SIDEBAR_ID } from './ReviewQueueToolbar'

type ReviewQueueSidebarProps = {
	cards: ReadonlyArray<Card>
	currentCardId: Card['_id'] | null
	today: DateString
	filter: CardTypeFilter
	onCardClick: (cardId: Card['_id']) => void
	onFilterChange: (filter: CardTypeFilter) => void
	onClose: () => void
}

const styles = stylex.create({
	panel: {
		borderColor: {
			default: colorsSemantic.borderSubtle,
			'@media (prefers-color-scheme: dark)': baseColors.transparent,
		},
		borderRadius: radii['2xl'],
		borderStyle: 'solid',
		borderWidth: 1,
		backgroundColor: colorsSemantic.surfacePrimary,
		blockSize: '100%',
		boxShadow: {
			default: 'none',
			[breakpoints.desktop]: `0 0 4px ${colorsSemantic.shadowSubtle}`,
		},
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		// TODO: add mobile drawer
		// Leaves the card at least half the row on narrow windows.
		maxInlineSize: '50%',
		minBlockSize: 0,
		position: 'relative',
	},
	width: (width: number) => ({
		inlineSize: `${width}px`,
	}),
	// The middle of the workspace gap beside the card. Insets start inside
	// the panel's 1px border, hence the extra pixel.
	resizeHandle: {
		insetInlineStart: `calc(${spacing.sm} / -2 - 1px)`,
	},
	header: {
		gap: spacing.xs,
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		alignItems: 'stretch',
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
	},
	titleRow: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'space-between',
	},
	titleText: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.semibold,
	},
	closeButton: {
		flexShrink: 0,
		marginInlineEnd: `calc(${spacing.xs} * -1)`,
	},
	list: {
		paddingInline: spacing.md,
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: 0,
		paddingBlockStart: spacing.xs,
		overflowY: 'auto',
	},
	empty: {
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,
	},
})

export function ReviewQueueSidebar({
	cards,
	currentCardId,
	today,
	filter,
	onCardClick,
	onFilterChange,
	onClose,
}: ReviewQueueSidebarProps) {
	const headingId = useId()
	const { width, handleProps } = useResizableWidth({
		storageKey: 'reviewQueueSidebarWidth',
		defaultWidth: 320,
		minWidth: 200,
		maxWidth: 480,
		edge: 'start',
	})

	return (
		<aside
			id={REVIEW_QUEUE_SIDEBAR_ID}
			aria-labelledby={headingId}
			{...stylex.props(styles.panel, styles.width(width))}
		>
			<div {...stylex.props(styles.header)}>
				<div {...stylex.props(styles.titleRow)}>
					<h2 id={headingId} {...stylex.props(styles.titleText)}>
						Queue
					</h2>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									aria-label='Close queue'
									iconOnly
									xstyle={styles.closeButton}
									shape='round'
									size='medium'
									variant='ghost'
									onClick={onClose}
								>
									<X aria-hidden='true' size={iconSizes.sm} />
								</Button>
							}
						/>
						<TooltipContent>Close queue</TooltipContent>
					</Tooltip>
				</div>
				<CardTypeFilterBadges
					value={filter}
					onValueChange={onFilterChange}
				/>
			</div>
			<div {...stylex.props(styles.list, scrollFade.y)}>
				{cards.length === 0 ? (
					<p {...stylex.props(styles.empty)}>No cards.</p>
				) : null}
				<CardList>
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
									card._id === currentCardId
										? 'true'
										: undefined,
							}}
						/>
					))}
				</CardList>
			</div>
			<ResizeHandle {...handleProps} xstyle={styles.resizeHandle} />
		</aside>
	)
}
