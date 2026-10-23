import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { Card as CardModel, CardSrsState } from '../types/review.types'
import { CardActions } from './CardActions'
import { CardMetadata } from './CardMetadata'

const densityVariants = stylex.create({
	comfortable: {
		marginInline: `calc(${spacing.lg} * -1)`,
		paddingBlock: spacing.lg,
		paddingInline: spacing.lg,
		fontSize: fontSizes.lg,
	},
	compact: {
		marginInline: `calc(${spacing.md} * -1)`,
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,
		fontSize: fontSizes.md,
	},
})

const styles = stylex.create({
	outer: {
		position: 'relative',

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

		color: colorsSemantic.textPrimary,
	},
	raised: {
		// Create seperate z-index context so overlay button
		// doesn't capture interactions
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
	overlayButton: {
		inset: 0,
		position: 'absolute',

		margin: spacing.none,
		padding: spacing.none,
		borderRadius: radii.lg,
		borderStyle: 'none',
		backgroundColor: 'transparent',

		cursor: 'pointer',

		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
})

type CardItemProps = {
	card: CardModel
	srs: CardSrsState
	today: DateString
	density?: keyof typeof densityVariants
	active?: boolean
	onClick: () => void
	buttonProps?: Omit<
		React.ComponentProps<'button'>,
		'onClick' | 'type' | 'className' | 'style'
	>
}

export function CardItem({
	card,
	srs,
	today,
	density = 'comfortable',
	active = false,
	onClick,
	buttonProps,
}: CardItemProps) {
	const { type, primaryText, secondaryText } = card
	// Flashcard secondary text is the answer, so never show it in lists.
	const secondaryShown = type === 'practice'

	return (
		<div
			data-active={active ? '' : undefined}
			{...stylex.props(
				styles.outer,
				densityVariants[density],
				active && styles.active,
			)}
		>
			<button
				type='button'
				onClick={onClick}
				{...stylex.props(styles.overlayButton)}
				{...buttonProps}
			/>

			<div {...stylex.props(styles.inner)}>
				<h3 {...stylex.props(styles.title)}>
					{primaryText.trim() || 'Untitled'}
				</h3>

				{secondaryText && secondaryShown ? (
					<p {...stylex.props(styles.secondaryText)}>
						{secondaryText}
					</p>
				) : null}

				<div {...stylex.props(styles.footer)}>
					<CardMetadata {...srs} today={today} onClick={onClick} />
					<CardActions card={card} xstyle={styles.raised} />
				</div>
			</div>
		</div>
	)
}
