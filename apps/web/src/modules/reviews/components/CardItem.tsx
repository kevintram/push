import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { textFade } from '~/styles/textFade'
import {
	fontSizes,
	fontWeights,
	layout,
	radii,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { Card as CardModel, CardSrsState } from '../types/review.types'
import { CardActions } from './CardActions'
import { CardDueDate } from './CardDueDate'
import { CardLastReviewed } from './CardLastReviewed'
import { StrengthSignal } from './StrengthSignal'

// A local string, not a shared constant: StyleX can leave an imported
// at-rule key unresolved in dev, emitting invalid CSS.
const wide = '@container (min-width: 560px)'
// Stacked rows run out of room for the whole metadata line, so the strength
// drops first.
const noStrength = '@container (width < 280px)'

const styles = stylex.create({
	// A table row. Stacked by default, as a wrapping flex row with the title
	// and actions above the dates and strength. Once the list is wide enough
	// the row joins the table's columns through subgrid, so the actions column
	// fits the row with the most toggles. Grid placement on the cells only
	// applies to the table.
	row: {
		alignItems: 'center',
		columnGap: {
			default: spacing.none,
			[wide]: spacing.lg,
		},
		display: {
			default: 'flex',
			[wide]: 'grid',
		},
		flexWrap: 'wrap',
		gridColumnEnd: {
			default: null,
			[wide]: '-1',
		},
		gridColumnStart: {
			default: null,
			[wide]: '1',
		},
		gridTemplateColumns: {
			default: null,
			[wide]: 'subgrid',
		},
		minBlockSize: {
			default: null,
			[wide]: '52px',
		},
		position: 'relative',

		borderRadius: radii.lg,
		marginInline: `calc(${layout.rowBleed} * -1)`,
		paddingBlock: {
			default: spacing.sm,
			[wide]: spacing.xs,
		},
		paddingInline: layout.rowBleed,
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparentHover,
		},
		cursor: 'pointer',

		// The ring wraps the row when its title target has keyboard focus.
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':has(> [role=cell] > :focus-visible)': colorsSemantic.borderFocus,
		},
		outlineOffset: '-2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',

		// Stacked, a full-width break between the actions and the metadata,
		// so the metadata line can run under the actions.
		'::after': {
			content: '""',
			display: {
				default: null,
				[wide]: 'none',
			},
			flexBasis: '100%',
			order: 1,
		},
	},
	active: {
		backgroundColor: {
			default: colorsSemantic.surfaceTransparentActive,
			':hover': colorsSemantic.surfaceTransparentActive,
		},
	},

	cell: {
		padding: 0,
	},
	// Above the row's stretched target, so tooltips can show. Clicks on these
	// cells are forwarded to the target.
	raised: {
		position: 'relative',
		zIndex: 1,
	},
	// Stacked, metadata cells space themselves with margins, so hidden cells
	// leave no gap behind.
	metadata: {
		gridRowStart: '1',
		marginBlockStart: {
			default: spacing['2xs'],
			[wide]: spacing.none,
		},
		marginInlineEnd: {
			default: spacing.md,
			[wide]: spacing.none,
		},
		order: 2,

		fontSize: fontSizes.sm,
		fontVariantNumeric: 'tabular-nums',
	},
	stackedHidden: {
		display: {
			default: 'none',
			[wide]: 'block',
		},
	},

	title: {
		flexBasis: 0,
		flexGrow: 1,
		gridColumnStart: '1',
		gridRowStart: '1',

		alignItems: 'center',
		display: 'flex',
		minInlineSize: 0,
	},
	// Fills the cell so the fade only reaches text long enough to run into it.
	target: {
		padding: 0,

		display: 'flex',
		flexGrow: 1,
		minInlineSize: 0,

		textDecoration: 'none',
		fontFamily: 'inherit',
		fontSize: fontSizes.md,
		fontWeight: fontWeights.regular,
		textAlign: 'start',

		backgroundColor: colorsSemantic.surfaceTransparent,
		color: colorsSemantic.textPrimary,
		cursor: 'pointer',

		borderWidth: 0,
		outlineStyle: 'none',

		// stretched link trick
		'::after': {
			inset: 0,
			content: '""',
			position: 'absolute',
		},
	},

	due: { gridColumnStart: '2' },
	lastReviewed: { gridColumnStart: '3' },
	strength: {
		display: {
			default: null,
			[noStrength]: 'none',
		},
		gridColumnStart: '4',
	},
	actions: {
		gridColumnStart: '5',
		gridRowStart: '1',
		justifySelf: 'end',

		marginInlineStart: {
			default: spacing.sm,
			[wide]: spacing.none,
		},
	},
})

type CardItemProps = {
	card: CardModel
	srs: CardSrsState
	today: DateString
	active?: boolean
	/** Run on activation. Without it, the row links to the card's page. */
	onClick?: () => void
	buttonProps?: Omit<
		React.ComponentProps<'button'>,
		'onClick' | 'type' | 'className' | 'style'
	>
}

/** A card as a row of `CardList`. */
export function CardItem({
	card,
	srs,
	today,
	active = false,
	onClick,
	buttonProps,
}: CardItemProps) {
	const navigate = useNavigate()
	const { _id, primaryText } = card
	const { lastRating, lastReviewedAt, nextDueAt, stability } = srs
	const title = primaryText.trim() || 'Untitled'
	const isNew = lastReviewedAt === null

	const activate =
		onClick ??
		(() => void navigate({ to: '/cards/$cardId', params: { cardId: _id } }))

	const titleText = <span {...stylex.props(textFade.line)}>{title}</span>

	// The table's grid layout can drop its native roles, so name them.
	return (
		<tr
			role='row'
			{...stylex.props(
				styles.row,
				stylex.defaultMarker(),
				active && styles.active,
			)}
		>
			<td role='cell' {...stylex.props(styles.cell, styles.title)}>
				{onClick ? (
					<button
						type='button'
						onClick={onClick}
						{...stylex.props(styles.target)}
						{...buttonProps}
					>
						{titleText}
					</button>
				) : (
					<Link
						to='/cards/$cardId'
						params={{ cardId: _id }}
						{...stylex.props(styles.target)}
					>
						{titleText}
					</Link>
				)}
			</td>

			{/* Stacked, a new card's line only says it is new. */}
			<td
				role='cell'
				onClick={activate}
				{...stylex.props(
					styles.cell,
					styles.raised,
					styles.metadata,
					styles.due,
					(isNew || nextDueAt === null) && styles.stackedHidden,
				)}
			>
				<CardDueDate date={nextDueAt} today={today} />
			</td>

			<td
				role='cell'
				onClick={activate}
				{...stylex.props(
					styles.cell,
					styles.raised,
					styles.metadata,
					styles.lastReviewed,
				)}
			>
				<CardLastReviewed
					lastRating={lastRating}
					lastReviewedAt={lastReviewedAt}
					today={today}
				/>
			</td>

			<td
				role='cell'
				onClick={activate}
				{...stylex.props(
					styles.cell,
					styles.raised,
					styles.metadata,
					styles.strength,
					stability === null && styles.stackedHidden,
				)}
			>
				<StrengthSignal stability={stability} />
			</td>

			<td
				role='cell'
				{...stylex.props(styles.cell, styles.raised, styles.actions)}
			>
				<CardActions card={card} isMenuHoverRevealed />
			</td>
		</tr>
	)
}
