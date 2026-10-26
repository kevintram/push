import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { Card as CardModel, CardSrsState } from '../types/review.types'
import { CardActions } from './CardActions'
import { CardMetadata } from './CardMetadata'

// TODO(3): Consider merging with CardItem; the two differ only in their
// interaction target (stretched link vs. overlay button).
const styles = stylex.create({
	outer: {
		position: 'relative',

		marginInline: `calc(${spacing.lg} * -1)`,
		paddingBlock: spacing.lg,
		paddingInline: spacing.lg,
		fontSize: fontSizes.lg,

		borderRadius: radii.lg,

		backgroundColor: {
			':hover': colorsSemantic.surfaceTransparentHover,
		},

		color: colorsSemantic.textPrimary,
	},
	active: {
		backgroundColor: {
			default: colorsSemantic.surfaceTransparentActive,
			':hover': colorsSemantic.surfaceTransparentActive,
		},
	},
	inner: {
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
	title: {
		fontSize: 'inherit',
		fontWeight: fontWeights.semibold,

		textDecoration: 'none',
		color: colorsSemantic.textPrimary,

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
	const navigate = useNavigate()
	// Flashcard secondary text is the answer, so never show it in lists.
	const secondaryShown = type === 'practice'

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
					{/* The metadata's tooltip triggers sit above the stretched
					link, so forward their clicks to it. */}
					<CardMetadata
						{...srs}
						today={today}
						onClick={() =>
							navigate({
								to: '/cards/$cardId',
								params: { cardId: _id },
							})
						}
					/>
					<CardActions card={card} xstyle={styles.raised} />
				</div>
			</div>
		</div>
	)
}
