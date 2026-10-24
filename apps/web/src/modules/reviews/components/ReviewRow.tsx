import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import { Ellipsis } from 'lucide-react'

import {
	Button,
	DialogTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
// StyleX's dev server only resolves shared constants through the `~` alias.
import { reviewTable } from '~/modules/reviews/components/reviewTable.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	fontSizes,
	iconSizes,
	layout,
	radii,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { Rating, Review } from '../types/review.types'
import { RatingPicker } from './RatingPicker'
import { ReviewDate } from './ReviewDate'
import { ReviewNotesIndicator } from './ReviewNotesIndicator'
import { ReviewStrength } from './ReviewStrength'

// Like claude.ai's sidebar, long descriptions fade out instead of ending in
// an ellipsis. Stacked, the description runs under the actions, so while they
// show the fade ends short of them, leaving a clear spot for the button.
const FADE = '24px'
// `buttonSizes.micro`, inlined because constants must be static.
const ACTIONS_CLEARANCE = '1.625rem'
const restingFade = `linear-gradient(to right, black calc(100% - ${FADE}), transparent)`
const actionsFade = `linear-gradient(to right, black calc(100% - ${FADE} - ${ACTIONS_CLEARANCE}), transparent calc(100% - ${ACTIONS_CLEARANCE}))`

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
		columnGap: '6px',
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
	raised: {
		position: 'relative',
		zIndex: 1,
	},
	descriptionText: {
		overflow: 'hidden',
		flexGrow: 1,
		minInlineSize: 0,
		whiteSpace: 'nowrap',

		maskImage: {
			default: restingFade,
			[reviewTable.stacked]: {
				// Touch shows the actions all the time.
				default: actionsFade,
				'@media (hover: hover)': {
					default: restingFade,
					// Matches `actionsTrigger`.
					[stylex.when.ancestor(':has(:focus-visible)')]: actionsFade,
					[stylex.when.ancestor(':has([data-popup-open])')]:
						actionsFade,
					[stylex.when.ancestor(':hover')]: actionsFade,
				},
			},
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
	muted: {
		color: colorsSemantic.textSecondary,
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
	// Shown while the row is hovered, keyboard focused, or has its menu open.
	// Always shown on touch, where there is no hover to reveal it.
	actionsTrigger: {
		opacity: {
			default: null,
			'@media (hover: hover)': {
				default: 0,
				[stylex.when.ancestor(':has(:focus-visible)')]: 1,
				[stylex.when.ancestor(':has([data-popup-open])')]: 1,
				[stylex.when.ancestor(':hover')]: 1,
			},
		},
	},
})

type ReviewRowProps = {
	onDelete: () => void
	onSetRating: (rating: Rating | null) => void
	review: Review
}

/**
 * A review as a table row. Render it inside the review's `Dialog`, which the
 * row's description or overlay opens.
 */
export function ReviewRow({ onDelete, onSetRating, review }: ReviewRowProps) {
	const description = review.description.trim()
	const hasDescription = description.length > 0
	// A pending review has no strength yet. The table keeps its dash so the
	// column stays readable, but the stacked layout drops it.
	const hasStrength =
		review.rating !== undefined && review.stabilityAfter != null
	const hasNotes = review.notes.trim().length > 0
	const date = (review.date ?? null) as DateString | null
	// The notes marker sits with the description in the table, and before the
	// date when stacked. Raised above the row's trigger so its tooltip can show.
	const notesIndicator = (xstyle: StyleXStyles) =>
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
						<span {...stylex.props(styles.descriptionText)}>
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
				{notesIndicator(styles.stackedHidden)}
			</td>
			<td
				role='cell'
				{...stylex.props(
					styles.cell,
					styles.whole,
					styles.date,
					hasDescription && styles.secondLine,
					date === null && !hasNotes && styles.stackedHidden,
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
						isCompleted={review.rating !== undefined}
						xstyle={styles.raised}
					/>
				)}
			</td>
			<td
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
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label='Review actions'
								iconOnly
								shape='round'
								size='micro'
								variant='ghost'
								xstyle={styles.actionsTrigger}
							/>
						}
					>
						<Ellipsis aria-hidden='true' size={iconSizes.sm} />
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuItem onClick={onDelete}>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</td>
		</tr>
	)
}
