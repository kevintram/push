import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { cardItemColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import { useHideMode } from '../hide-mode/useHideMode'
import type { Card as CardModel, CardSrsState } from '../types/review.types'
import { CardActions } from './CardActions'
import { CardMetadata } from './CardMetadata'
import { Hideable } from './Hideable'

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

type CardItemProps = {
	card: CardModel
	srs: CardSrsState
	today: DateString
}

export function CardItem({ card, srs, today }: CardItemProps) {
	const { _id, type, primaryText, secondaryText } = card
	const { hideMode } = useHideMode()

	const [secondaryRevealed, setSecondaryRevealed] = useState(false)

	const secondaryShown =
		type === 'practice' || // always show if practice
		hideMode === 'off' || // always show if hideMode off
		secondaryRevealed

	useEffect(() => {
		// reset secondaryRevealed
		setSecondaryRevealed(false)
	}, [hideMode, _id])

	return (
		<div {...stylex.props(styles.outer)}>
			<div {...stylex.props(styles.inner)}>
				<Link
					to='/cards/$cardId'
					params={{ cardId: _id }}
					{...stylex.props(styles.title)}
				>
					{primaryText.trim() || 'Untitled'}
				</Link>

				{secondaryText ? (
					<Hideable
						revealed={secondaryShown}
						onRevealedChange={setSecondaryRevealed}
						// Only raise while hidden so the Reveal button stays
						// clickable; once revealed, let the answer text fall
						// under the stretched link so the card stays navigable.
						xstyle={secondaryShown ? undefined : styles.raised}
					>
						<p {...stylex.props(styles.secondaryText)}>
							{secondaryText}
						</p>
					</Hideable>
				) : null}

				<div {...stylex.props(styles.footer)}>
					<CardMetadata {...srs} today={today} />
					<CardActions card={card} xstyle={styles.raised} />
				</div>
			</div>
		</div>
	)
}
