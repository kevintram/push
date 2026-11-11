import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'
import { useId } from 'react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
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
	onCardClick: (cardId: Card['_id']) => void
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
		// Fills the slot ReviewQueueWorkspace sizes and resizes.
		flexGrow: 1,
		minBlockSize: 0,
		minInlineSize: 0,
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
	onCardClick,
	onClose,
}: ReviewQueueSidebarProps) {
	const headingId = useId()

	return (
		<aside
			id={REVIEW_QUEUE_SIDEBAR_ID}
			aria-labelledby={headingId}
			{...stylex.props(styles.panel)}
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
								'aria-label': `Select ${card.prompt.trim() || 'Untitled'}`,
								'aria-current':
									card._id === currentCardId
										? 'true'
										: undefined,
							}}
						/>
					))}
				</CardList>
			</div>
		</aside>
	)
}
