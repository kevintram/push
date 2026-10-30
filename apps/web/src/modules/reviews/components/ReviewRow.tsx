import * as stylex from '@stylexjs/stylex'

import { DialogTrigger } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { textFade } from '~/styles/textFade'
import { fontSizes, layout, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { Rating, Review } from '../types/review.types'
import { RatingPicker } from './RatingPicker'
import { ReviewDate } from './ReviewDate'
import { ReviewNotesIndicator } from './ReviewNotesIndicator'
import { ReviewRowActions } from './ReviewRowActions'
import { ReviewStrength } from './ReviewStrength'

// A local string, not a shared constant: StyleX can leave an imported
// at-rule key unresolved in dev, emitting invalid CSS.
const wide = '@container (min-width: 560px)'
// Stacked rows run out of room for the whole details line, so the strength
// change drops first, then the strength itself.
const noStrengthChange = '@container (width < 300px)'
const noStrength = '@container (width < 280px)'

const styles = stylex.create({
	// A table row. Once the list is wide enough, the notes, date, and strength
	// get their own columns. Stacked, they move to a details line under the
	// description, so the row keeps only the rating, description, and actions
	// columns.
	row: {
		// Acts as a minimum on a table row.
		blockSize: {
			default: null,
			[wide]: '44px',
		},
		// Contains the trigger's stretched highlight.
		position: 'relative',

		cursor: 'pointer',
	},
	// Above the trigger's stretched highlight, so the control stays clickable
	// or its tooltip can show. Cells raised only for a tooltip forward clicks
	// to `onOpen`.
	raised: {
		position: 'relative',
		zIndex: 1,
	},
	muted: {
		color: colorsSemantic.textSecondary,
	},
	stackedHidden: {
		display: {
			default: 'none',
			[wide]: 'inline',
		},
	},

	cell: {
		paddingBlock: spacing.xs,
		paddingInline: 0,
	},
	// Every cell after the rating's.
	gap: {
		paddingInlineStart: {
			default: spacing.sm,
			[wide]: spacing.lg,
		},
	},
	// Stacked, the rating and actions sit on the description's line.
	edge: {
		verticalAlign: {
			default: 'top',
			[wide]: 'middle',
		},
	},
	// Takes the room the other columns, sized to their content, leave. The
	// maximum stops a description, which never wraps, from widening the table
	// past its container.
	description: {
		inlineSize: '100%',
		maxInlineSize: 0,
	},
	// Opens the review. Fills the cell so the fade only reaches text long
	// enough to run into it.
	trigger: {
		padding: 0,

		alignItems: 'center',
		display: 'flex',
		inlineSize: '100%',

		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		textAlign: 'start',

		backgroundColor: colorsSemantic.surfaceTransparent,
		color: colorsSemantic.textPrimary,
		cursor: 'pointer',

		borderWidth: 0,
		outlineStyle: 'none',

		// Stretched over the row, so the whole row is the trigger, and drawn as
		// its highlight and focus ring. It bleeds past the text like a card row.
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

	// The stacked row's notes marker, date, and strength, under the
	// description. It runs out of the description cell and under the actions.
	details: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: {
			default: 'flex',
			[wide]: 'none',
		},
		// Sized to its items, so they overflow the cell rather than shrink.
		inlineSize: 'max-content',

		fontSize: fontSizes.sm,
	},
	// Sets the details line off from the description above it. Without a
	// description, the details line is the row's only line and needs no gap.
	secondLine: {
		marginBlockStart: spacing.xs,
	},
	detailsStrength: {
		display: {
			default: 'contents',
			[noStrength]: 'none',
		},
	},
	strengthChange: {
		display: {
			default: null,
			[noStrengthChange]: 'none',
		},
	},
	// A notes, date, or strength column, shown only in the table.
	column: {
		display: {
			default: 'none',
			[wide]: 'table-cell',
		},
		whiteSpace: 'nowrap',

		fontSize: fontSizes.sm,
	},
	// Centers the icon on the line rather than sitting it on the baseline.
	notesIndicator: {
		verticalAlign: 'middle',
	},
})

type ReviewRowProps = {
	onDelete: () => void
	onOpen: () => void
	onSetRating: (rating: Rating | null) => void
	review: Review
}

/**
 * A review as a table row. Render it inside the review's `Dialog`, which the
 * row's trigger opens.
 */
export function ReviewRow({
	onDelete,
	onOpen,
	onSetRating,
	review,
}: ReviewRowProps) {
	const description = review.description.trim()
	const date = (review.date ?? null) as DateString | null

	const hasDescription = description.length > 0
	const hasNotes = review.notes.trim().length > 0
	const isCompleted = review.rating !== undefined
	// A pending review has no strength yet. The table keeps its dash so the
	// column stays readable, but the details line drops it.
	const hasStrength = isCompleted && review.stabilityAfter != null

	const metadataCell = [styles.cell, styles.gap, styles.column, styles.raised]

	return (
		<tr {...stylex.props(styles.row, stylex.defaultMarker())}>
			<td {...stylex.props(styles.cell, styles.edge, styles.raised)}>
				<RatingPicker
					onSetRating={onSetRating}
					rating={review.rating}
				/>
			</td>

			<td {...stylex.props(styles.cell, styles.gap, styles.description)}>
				{/* Without a description there is nothing to name the row, so
				the trigger takes its name from aria-label. */}
				<DialogTrigger
					aria-label={hasDescription ? undefined : 'Open review'}
					{...stylex.props(styles.trigger)}
				>
					{hasDescription ? (
						<span {...stylex.props(textFade.line)}>
							{description}
						</span>
					) : (
						// The table fills the empty cell with a dash, like the
						// strength.
						<span
							aria-hidden='true'
							{...stylex.props(
								styles.stackedHidden,
								styles.muted,
							)}
						>
							—
						</span>
					)}
				</DialogTrigger>
				<div
					onClick={onOpen}
					{...stylex.props(
						styles.details,
						styles.raised,
						hasDescription && styles.secondLine,
					)}
				>
					{hasNotes ? (
						<ReviewNotesIndicator notes={review.notes} />
					) : null}
					{date !== null ? (
						<ReviewDate date={date} isCompleted={isCompleted} />
					) : null}
					{hasStrength ? (
						<span {...stylex.props(styles.detailsStrength)}>
							<ReviewStrength
								changeXstyle={styles.strengthChange}
								review={review}
								size='micro'
							/>
						</span>
					) : null}
				</div>
			</td>

			<td onClick={onOpen} {...stylex.props(metadataCell)}>
				{hasNotes ? (
					<ReviewNotesIndicator
						notes={review.notes}
						xstyle={styles.notesIndicator}
					/>
				) : null}
			</td>

			<td onClick={onOpen} {...stylex.props(metadataCell)}>
				{date === null ? (
					// Like a pending strength, a missing date shows a dash.
					<span {...stylex.props(styles.muted)}>—</span>
				) : (
					<ReviewDate date={date} isCompleted={isCompleted} />
				)}
			</td>

			<td onClick={onOpen} {...stylex.props(metadataCell)}>
				<ReviewStrength review={review} size='micro' />
			</td>

			<td
				{...stylex.props(
					styles.cell,
					styles.gap,
					styles.edge,
					styles.raised,
				)}
			>
				<ReviewRowActions onDelete={onDelete} />
			</td>
		</tr>
	)
}
