import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import { useHideMode } from '../hide-mode/useHideMode'
import type {
	ReviewCard as ReviewCardModel,
	ReviewCardSrsState,
} from '../types/review.types'
import { Hideable } from './Hideable'
import { ReviewCardActions } from './ReviewCardActions'
import { ReviewCardMetadata } from './ReviewCardMetadata'

const styles = stylex.create({
	container: {
		paddingBlock: spacing.lg,
		position: 'relative',

		gap: spacing.md,
		display: 'flex',
		flexDirection: 'column',

		borderBottomColor: colors.borderSecondary,
		borderBottomStyle: 'solid',
		borderBottomWidth: '1px',

		color: colors.text,
	},
	title: {
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,

		textDecoration: 'none',
		color: colors.text,

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
		paddingBlock: spacing.sm,
		fontSize: fontSizes.sm,
	},

	footer: {
		gap: spacing.md,
		alignItems: 'center',
		display: 'flex',
	},
})

type ReviewCardProps = {
	reviewCard: ReviewCardModel
	srs: ReviewCardSrsState
}

export function ReviewCard({ reviewCard, srs }: ReviewCardProps) {
	const { _id, type, primaryText, secondaryText } = reviewCard
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
		<div {...stylex.props(styles.container)}>
			<Link
				to='/review-cards/$reviewCardId'
				params={{ reviewCardId: _id }}
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
				<ReviewCardMetadata {...srs} />
				<ReviewCardActions
					reviewCard={reviewCard}
					xstyle={styles.raised}
				/>
			</div>
		</div>
	)
}
