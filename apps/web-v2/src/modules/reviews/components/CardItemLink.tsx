import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { cardItemColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import { useHideMode } from '../hide-mode/useHideMode'
import type { Card as CardModel, CardSrsState } from '../types/review.types'
import { CardActions } from './CardActions'
import { CardMetadata } from './CardMetadata'

const styles = stylex.create({
	outer: {
		position: 'relative',

		marginInline: `calc(${spacing.lg} * -1)`,
		paddingInline: spacing.lg,

		borderRadius: radii.lg,

		backgroundColor: {
			':hover': cardItemColors.containerBackgroundHover,
		},

		color: cardItemColors.containerForeground,
	},
	active: {
		backgroundColor: {
			default: cardItemColors.containerBackgroundActive,
			':hover': cardItemColors.containerBackgroundActiveHover,
		},
	},
	inner: {
		paddingBlock: spacing.lg,

		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,

		textDecoration: 'none',
		color: cardItemColors.titleForeground,

		// Stretched-link trick
		'::after': {
			inset: 0,
			content: '""',
			position: 'absolute',
		},
	},
	raised: {
		// Create seperate z-index context so streched-link
		// overlay doesn't capture interactins
		position: 'relative',
		zIndex: 1,
	},
	secondaryText: {
		fontSize: fontSizes.sm,
	},
	footer: {
		gap: spacing.md,
		alignItems: 'center',
		display: 'flex',
	},
})

type CardItemLinkProps = {
	card: CardModel
	srs: CardSrsState
	today: DateString
	active?: boolean
}

export function CardItemLink({
	card,
	srs,
	today,
	active = false,
}: CardItemLinkProps) {
	const { _id, type, primaryText, secondaryText } = card
	const { hideMode } = useHideMode()

	const secondaryShown = type === 'practice' || hideMode === 'off'

	return (
		<div
			data-active={active ? '' : undefined}
			{...stylex.props(styles.outer, active && styles.active)}
		>
			<div {...stylex.props(styles.inner)}>
				<Link
					to='/cards/$cardId'
					params={{ cardId: _id }}
					{...stylex.props(styles.title)}
				>
					{primaryText.trim() || 'Untitled'}
				</Link>

				{secondaryText && secondaryShown ? (
					<p {...stylex.props(styles.secondaryText)}>
						{secondaryText}
					</p>
				) : null}

				<div {...stylex.props(styles.footer)}>
					<CardMetadata {...srs} today={today} />
					<CardActions card={card} xstyle={styles.raised} />
				</div>
			</div>
		</div>
	)
}
