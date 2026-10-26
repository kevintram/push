import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'

import { DialogTrigger } from '~/components/ui'
// StyleX's dev server only resolves shared constants through the `~` alias.
import { reviewTable } from '~/modules/reviews/components/reviewTable.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { textFade } from '~/styles/textFade'
import { textFadeVars } from '~/styles/textFade.stylex'
import { fontSizes, layout, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { Rating, Review } from '../types/review.types'
import { RatingPicker } from './RatingPicker'
import { ReviewDate } from './ReviewDate'
import { ReviewNotesIndicator } from './ReviewNotesIndicator'
import { ReviewRowActions } from './ReviewRowActions'
import { ReviewStrength } from './ReviewStrength'

// `buttonSizes.micro`, inlined because constants must be static.
const ACTIONS_CLEARANCE = '1.625rem'

const styles = stylex.create({
	// A table row laid out as a grid. Stacked by default, with the description
	// above the notes, date, and strength. Once the list is wide enough the
	// cells line up as table columns.
	row: {
		gridTemplateAreas: {
			default: `
				'rating description description description description'
				'. date strength . .'
			`,
			[reviewTable.wide]: reviewTable.areas,
		},
		alignItems: 'center',
		columnGap: {
			default: spacing.sm,
			[reviewTable.wide]: spacing.lg,
		},
		display: 'grid',
		gridTemplateColumns: {
			default: 'auto auto auto minmax(0, 1fr) auto',
			[reviewTable.wide]: reviewTable.columns,
		},
		minBlockSize: {
			default: null,
			[reviewTable.wide]: '44px',
		},
		position: 'relative',

		borderRadius: radii.lg,
		marginInline: `calc(${layout.rowBleed} * -1)`,
		paddingBlock: spacing.xs,
		paddingInline: layout.rowBleed,
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparentHover,
		},
		cursor: 'pointer',
	},
	// Stacked, a row without a description fits on one line. The empty
	// description cell stretches to push the actions to the end.
	withoutDescription: {
		gridTemplateAreas: {
			default: `'rating date strength description .'`,
			[reviewTable.wide]: reviewTable.areas,
		},
	},
	// The second line's gap is a margin rather than a row gap, so the line
	// takes no space when nothing on it shows.
	secondLine: {
		marginBlockStart: {
			default: spacing.xs,
			[reviewTable.wide]: spacing.none,
		},
	},

	cell: {
		padding: 0,
	},
	// Keep the date and strength whole; squeezing them shrinks their icons.
	whole: {
		minInlineSize: 'max-content',
	},
	// Above the row's open-review trigger, so the control stays clickable or
	// its tooltip can show. Cells raised only for a tooltip forward clicks to
	// `onOpen`.
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
			[reviewTable.wide]: 'block',
		},
	},
	tableHidden: {
		display: {
			default: null,
			[reviewTable.wide]: 'none',
		},
	},

	rating: {
		gridColumnEnd: 'rating',
		gridColumnStart: 'rating',
		gridRowEnd: 'rating',
		gridRowStart: 'rating',
	},

	description: {
		gridColumnEnd: 'description',
		gridColumnStart: 'description',
		gridRowEnd: 'description',
		gridRowStart: 'description',

		alignItems: 'center',
		display: 'flex',
		minInlineSize: 0,
	},
	// Fills the cell so the fade only reaches text long enough to run into it.
	descriptionTrigger: {
		padding: 0,

		display: 'flex',
		flexGrow: 1,
		minInlineSize: 0,

		fontSize: fontSizes.sm,
		textAlign: 'start',

		backgroundColor: colorsSemantic.surfaceTransparent,
		color: colorsSemantic.textPrimary,
		cursor: 'pointer',

		borderWidth: 0,

		// stretched link trick
		'::after': {
			inset: 0,
			content: '""',
			position: 'absolute',
		},
	},
	// Stacked, the description runs under the actions, so while they show the
	// fade ends short of them, leaving a clear spot for the button.
	descriptionText: {
		// Null defaults leave the inherited inset in place. StyleX emits a
		// var's default outside its layers, where it would beat every condition.
		[textFadeVars.inset]: {
			default: null,
			[reviewTable.stacked]: {
				default: null,
				'@media (hover: hover)': {
					default: null,
					// Matches the trigger in `ReviewRowActions`.
					[stylex.when.ancestor(':has(:focus-visible)')]:
						ACTIONS_CLEARANCE,
					[stylex.when.ancestor(':has([data-popup-open])')]:
						ACTIONS_CLEARANCE,
					[stylex.when.ancestor(':hover')]: ACTIONS_CLEARANCE,
				},
				// Touch shows the actions all the time.
				'@media (hover: none)': ACTIONS_CLEARANCE,
			},
		},
	},
	// Without a description there is nothing to label the row, so the trigger
	// covers it directly and takes its name from aria-label.
	overlayTrigger: {
		inset: 0,
		position: 'absolute',

		backgroundColor: colorsSemantic.surfaceTransparent,
		cursor: 'pointer',

		borderRadius: radii.lg,
		borderWidth: 0,
	},

	// Only the table has a notes column. Stacked, the marker leads the date.
	notes: {
		gridColumnEnd: 'notes',
		gridColumnStart: 'notes',
		gridRowEnd: 'notes',
		gridRowStart: 'notes',

		// Flex, not block, so the icon centers instead of sitting on a baseline.
		display: {
			default: 'none',
			[reviewTable.wide]: 'flex',
		},
	},

	date: {
		gridColumnEnd: 'date',
		gridColumnStart: 'date',
		gridRowEnd: 'date',
		gridRowStart: 'date',

		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',

		fontSize: fontSizes.sm,
	},

	strength: {
		gridColumnEnd: 'strength',
		gridColumnStart: 'strength',
		gridRowEnd: 'strength',
		gridRowStart: 'strength',

		display: {
			default: null,
			[reviewTable.noStrength]: 'none',
		},
	},
	strengthChange: {
		display: {
			default: null,
			[reviewTable.noStrengthChange]: 'none',
		},
	},

	// Stacked, the actions sit over the end of the first line, on top of the
	// description.
	actions: {
		gridColumnEnd: {
			default: '-1',
			[reviewTable.wide]: 'actions',
		},
		gridColumnStart: {
			default: '-2',
			[reviewTable.wide]: 'actions',
		},
		gridRowEnd: {
			default: '2',
			[reviewTable.wide]: 'actions',
		},
		gridRowStart: {
			default: '1',
			[reviewTable.wide]: 'actions',
		},
		justifySelf: 'end',
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
 * row's description or overlay opens.
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
	// column stays readable, but the stacked layout drops it.
	const hasStrength = isCompleted && review.stabilityAfter != null
	// Stacked, the date cell also carries the notes marker.
	const hasStackedDate = date !== null || hasNotes

	// Rendered twice: in the table's notes column, and leading the stacked
	// date. Raised above the row's trigger so its tooltip can show.
	const notesIndicator = (xstyle?: StyleXStyles) =>
		hasNotes && (
			<ReviewNotesIndicator
				notes={review.notes}
				xstyle={[styles.raised, xstyle]}
			/>
		)

	// The table's grid layout can drop its native roles, so name them.
	return (
		<tr
			role='row'
			{...stylex.props(
				styles.row,
				stylex.defaultMarker(),
				!hasDescription && styles.withoutDescription,
			)}
		>
			<td
				role='cell'
				{...stylex.props(styles.cell, styles.rating, styles.raised)}
			>
				<RatingPicker
					onSetRating={onSetRating}
					rating={review.rating}
				/>
			</td>

			<td role='cell' {...stylex.props(styles.cell, styles.description)}>
				{hasDescription ? (
					<DialogTrigger {...stylex.props(styles.descriptionTrigger)}>
						<span
							{...stylex.props(
								textFade.line,
								styles.descriptionText,
							)}
						>
							{description}
						</span>
					</DialogTrigger>
				) : (
					<>
						<DialogTrigger
							aria-label='Open review'
							{...stylex.props(styles.overlayTrigger)}
						/>
						{/* The row's trigger already names it "Open review". The
						table fills the empty cell with a dash, like the strength. */}
						<span
							aria-hidden='true'
							{...stylex.props(
								styles.stackedHidden,
								styles.muted,
							)}
						>
							—
						</span>
					</>
				)}
			</td>

			<td
				onClick={onOpen}
				role='cell'
				{...stylex.props(styles.cell, styles.notes)}
			>
				{notesIndicator()}
			</td>

			<td
				onClick={onOpen}
				role='cell'
				{...stylex.props(
					styles.cell,
					styles.whole,
					styles.date,
					hasDescription && styles.secondLine,
					!hasStackedDate && styles.stackedHidden,
				)}
			>
				{notesIndicator(styles.tableHidden)}
				{date === null ? (
					// Like a pending strength, a missing date shows a dash only
					// in the table.
					<span {...stylex.props(styles.stackedHidden, styles.muted)}>
						—
					</span>
				) : (
					<ReviewDate
						date={date}
						isCompleted={isCompleted}
						xstyle={styles.raised}
					/>
				)}
			</td>

			<td
				onClick={onOpen}
				role='cell'
				{...stylex.props(
					styles.cell,
					styles.whole,
					styles.strength,
					styles.raised,
					hasDescription && styles.secondLine,
					!hasStrength && styles.stackedHidden,
				)}
			>
				<ReviewStrength
					changeXstyle={styles.strengthChange}
					review={review}
					size='micro'
				/>
			</td>

			<td
				role='cell'
				{...stylex.props(styles.cell, styles.actions, styles.raised)}
			>
				<ReviewRowActions onDelete={onDelete} />
			</td>
		</tr>
	)
}
