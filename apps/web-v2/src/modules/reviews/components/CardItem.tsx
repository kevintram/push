import * as stylex from '@stylexjs/stylex'

import { buttonColors, cardItemColors } from '~/styles/colors/components.stylex'
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
	innerCompact: {
		paddingBlock: spacing.md,
	},
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,

		color: cardItemColors.titleForeground,
	},
	titleCompact: {
		fontSize: fontSizes.md,
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
			default: buttonColors.focusRingRest,
			':focus-visible': buttonColors.focusRing,
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
	density?: 'comfortable' | 'compact'
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
	const { hideMode } = useHideMode()

	const secondaryShown = type === 'practice' || hideMode === 'off'

	return (
		<div
			data-active={active ? '' : undefined}
			{...stylex.props(styles.outer, active && styles.active)}
		>
			<button
				type='button'
				onClick={onClick}
				{...stylex.props(styles.overlayButton)}
				{...buttonProps}
			/>

			<div
				{...stylex.props(
					styles.inner,
					density === 'compact' && styles.innerCompact,
				)}
			>
				<h3
					{...stylex.props(
						styles.title,
						density === 'compact' && styles.titleCompact,
					)}
				>
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
