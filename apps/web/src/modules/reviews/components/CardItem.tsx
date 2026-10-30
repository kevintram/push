import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'
import type { MouseEvent } from 'react'

import { FadeText } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	fontSizes,
	fontWeights,
	layout,
	radii,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { Card as CardModel, CardSrsState } from '../types/review.types'
import { CardDueDate } from './CardDueDate'
import { CardLastReviewed } from './CardLastReviewed'
import { CardMenu } from './CardMenu'
import { CardNewIndicator } from './CardNewIndicator'
import { CardStatusToggles } from './CardStatusToggles'
import { StrengthSignal } from './StrengthSignal'

// A local string, not a shared constant: StyleX can leave an imported
// at-rule key unresolved in dev, emitting invalid CSS.
const wide = '@container (min-width: 560px)'
// Stacked rows run out of room for the whole details line, so the strength
// drops first.
const noStrength = '@container (width < 280px)'

const styles = stylex.create({
	// A table row. Once the list is wide enough, the due date, last review, and
	// strength get their own columns. Stacked, they move to a details line
	// under the title, so the row keeps only the title and actions columns.
	row: {
		// Acts as a minimum on a table row.
		blockSize: {
			default: null,
			[wide]: '52px',
		},
		// Contains the title target's stretched highlight.
		position: 'relative',

		cursor: 'pointer',
	},
	// Above the title target's stretched highlight, so tooltips can show.
	// Clicks on these cells are forwarded to the target; clicks on the title
	// bubble to it.
	raised: {
		position: 'relative',
		zIndex: 1,
	},

	cell: {
		paddingBlock: {
			default: spacing.sm,
			[wide]: spacing.xs,
		},
		paddingInline: 0,
	},
	// Takes the room the other columns, sized to their content, leave. The
	// maximum stops a title, which never wraps, from widening the table past
	// its container.
	title: {
		inlineSize: '100%',
		maxInlineSize: 0,
	},
	// Fills the cell so the fade only reaches text long enough to run into it.
	target: {
		padding: 0,

		alignItems: 'center',
		display: 'flex',
		inlineSize: '100%',

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

		// Stretched over the row, so the whole row is the target, and drawn as
		// its highlight and focus ring. It bleeds past the text like the
		// section titles.
		'::after': {
			insetBlock: 0,
			insetInline: `calc(${layout.rowBleed} * -1)`,
			content: '""',
			position: 'absolute',

			borderRadius: radii.lg,
			backgroundColor: {
				default: colorsSemantic.surfaceTransparent,
				[stylex.when.ancestor(':hover')]:
					colorsSemantic.surfaceTransparentHover,
			},

			outlineColor: {
				default: colorsSemantic.surfaceTransparent,
				':focus-visible': colorsSemantic.borderFocus,
			},
			outlineOffset: '-2px',
			outlineStyle: 'solid',
			outlineWidth: '2px',
		},
	},
	// Adjacent active rows join into one block, squaring the corners where
	// they meet. Each row marks itself `data-active` for its neighbors.
	activeTarget: {
		'::after': {
			backgroundColor: {
				default: colorsSemantic.surfaceTransparentActive,
				[stylex.when.ancestor(':hover')]:
					colorsSemantic.surfaceTransparentActive,
			},
			borderEndEndRadius: {
				default: radii.lg,
				[stylex.when.ancestor(':has(+ [data-active])')]: 0,
			},
			borderEndStartRadius: {
				default: radii.lg,
				[stylex.when.ancestor(':has(+ [data-active])')]: 0,
			},
			borderStartEndRadius: {
				default: radii.lg,
				[stylex.when.ancestor(':is([data-active] + *)')]: 0,
			},
			borderStartStartRadius: {
				default: radii.lg,
				[stylex.when.ancestor(':is([data-active] + *)')]: 0,
			},
		},
	},
	// Only the table marks a new card by its title. Stacked, the details line
	// already says "New".
	newIndicator: {
		display: {
			default: 'none',
			[wide]: 'inline-flex',
		},
	},

	// The stacked row's due date, last review, and strength, under the title.
	// It runs out of the title cell and under the actions, which sit on the
	// title's line.
	details: {
		alignItems: 'center',
		columnGap: spacing.md,
		display: {
			default: 'flex',
			[wide]: 'none',
		},
		// Sized to its items, so they overflow the cell rather than shrink.
		inlineSize: 'max-content',
		marginBlockStart: spacing['2xs'],

		fontSize: fontSizes.sm,
		fontVariantNumeric: 'tabular-nums',
	},
	// Overrides `StrengthSignal`'s own display, so it restates it.
	detailsStrength: {
		display: {
			default: 'inline-flex',
			[noStrength]: 'none',
		},
	},
	// A metadata column, shown only in the table.
	column: {
		display: {
			default: 'none',
			[wide]: 'table-cell',
		},
		paddingInlineStart: spacing.lg,
		whiteSpace: 'nowrap',

		fontSize: fontSizes.sm,
		fontVariantNumeric: 'tabular-nums',
	},
	// The status toggles and the menu get a column each, so every row's menu
	// lines up at the end whichever toggles it shows. Only the buttons are
	// raised, so a click elsewhere in these cells still reaches the row.
	actionCell: {
		verticalAlign: {
			default: 'top',
			[wide]: 'middle',
		},
	},
	status: {
		paddingInlineStart: {
			default: spacing.sm,
			[wide]: spacing.lg,
		},
	},
	menu: {
		paddingInlineStart: spacing.xs,
	},
	// Hugs the toggles, so the raised box leaves the rest of the cell to the row.
	toggles: {
		inlineSize: 'fit-content',
	},
	// In the table, the menu trigger shows while the row is hovered, keyboard
	// focused, or has its menu open. Stacked, or on touch, where there is no
	// hover to reveal it, it always shows.
	menuTrigger: {
		opacity: {
			default: null,
			[wide]: {
				default: null,
				'@media (hover: hover)': {
					default: 0,
					[stylex.when.ancestor(':has(:focus-visible)')]: 1,
					[stylex.when.ancestor(':has([data-popup-open])')]: 1,
					[stylex.when.ancestor(':hover')]: 1,
				},
			},
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
	/**
	 * Makes a linked row selectable: a click selects it, with the click's
	 * Shift and Mod keys left to the caller, and a double click opens the card.
	 * Middle-clicks still open it in a new tab, and Enter on the focused link
	 * still opens it.
	 */
	onSelect?: (event: MouseEvent) => void
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
	onSelect,
	buttonProps,
}: CardItemProps) {
	const navigate = useNavigate()
	const { _id, primaryText } = card
	const { lastRating, lastReviewedAt, nextDueAt, stability } = srs
	const title = primaryText.trim() || 'Untitled'
	const isNew = lastReviewedAt === null

	const open =
		onClick ??
		(() => void navigate({ to: '/cards/$cardId', params: { cardId: _id } }))
	// A click on a selectable row selects it, and a double click opens it.
	const activate = onSelect ?? open
	const handleDoubleClick = onSelect ? open : undefined

	const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
		// A keyboard click has no detail, and an Alt-click keeps its browser
		// meaning.
		if (!onSelect || event.detail === 0 || event.altKey) return

		event.preventDefault()
		onSelect(event)
	}

	const titleText = (
		<>
			<FadeText
				tooltipSide='bottom'
				tooltipAlign='start'
				xstyle={styles.raised}
			>
				{title}
			</FadeText>
			{isNew ? (
				<CardNewIndicator
					xstyle={[styles.raised, styles.newIndicator]}
				/>
			) : null}
		</>
	)

	const metadataProps = {
		onClick: activate,
		onDoubleClick: handleDoubleClick,
	}
	const targetStyles = stylex.props(
		styles.target,
		active && styles.activeTarget,
	)

	return (
		<tr
			data-active={active || undefined}
			{...stylex.props(styles.row, stylex.defaultMarker())}
		>
			<td {...stylex.props(styles.cell, styles.title)}>
				{onClick ? (
					<button
						type='button'
						onClick={onClick}
						{...targetStyles}
						{...buttonProps}
					>
						{titleText}
					</button>
				) : (
					<Link
						to='/cards/$cardId'
						params={{ cardId: _id }}
						data-card-id={_id}
						onClick={handleLinkClick}
						onDoubleClick={handleDoubleClick}
						{...targetStyles}
					>
						{titleText}
					</Link>
				)}
				{/* Stacked, a new card's line only says it is new. */}
				<div
					{...metadataProps}
					{...stylex.props(styles.details, styles.raised)}
				>
					{!isNew && nextDueAt !== null ? (
						<CardDueDate
							date={nextDueAt}
							today={today}
							variant='details'
						/>
					) : null}
					<CardLastReviewed
						lastRating={lastRating}
						lastReviewedAt={lastReviewedAt}
						today={today}
						variant='details'
					/>
					{stability !== null ? (
						<StrengthSignal
							stability={stability}
							xstyle={styles.detailsStrength}
						/>
					) : null}
				</div>
			</td>

			<td
				{...metadataProps}
				{...stylex.props(styles.cell, styles.column, styles.raised)}
			>
				<CardDueDate date={nextDueAt} today={today} variant='column' />
			</td>

			<td
				{...metadataProps}
				{...stylex.props(styles.cell, styles.column, styles.raised)}
			>
				<CardLastReviewed
					lastRating={lastRating}
					lastReviewedAt={lastReviewedAt}
					today={today}
					variant='column'
				/>
			</td>

			<td
				{...metadataProps}
				{...stylex.props(styles.cell, styles.column, styles.raised)}
			>
				<StrengthSignal stability={stability} />
			</td>

			<td
				{...stylex.props(styles.cell, styles.actionCell, styles.status)}
			>
				<CardStatusToggles
					card={card}
					xstyle={[styles.raised, styles.toggles]}
				/>
			</td>

			<td {...stylex.props(styles.cell, styles.actionCell, styles.menu)}>
				<CardMenu
					card={card}
					triggerXstyle={[styles.raised, styles.menuTrigger]}
				/>
			</td>
		</tr>
	)
}
