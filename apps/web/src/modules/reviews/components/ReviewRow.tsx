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

const styles = stylex.create({
	// A table row laid out as a grid. Stacked by default, with the description
	// above the date, strength, and actions. Once the list is wide enough the
	// cells line up as table columns.
	row: {
		gridTemplateAreas: {
			default: `
				'rating description description description description'
				'. date strength . actions'
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
		rowGap: spacing.xs,

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
			default: `'rating date strength description actions'`,
			[reviewTable.wide]: reviewTable.areas,
		},
		gridTemplateColumns: {
			default: 'auto auto auto minmax(0, 1fr) auto',
			[reviewTable.wide]: reviewTable.columns,
		},
	},
	// Stacked, a row with neither a date nor a strength keeps its actions on
	// the description line instead of leaving them alone below it.
	descriptionOnly: {
		gridTemplateAreas: {
			default: `'rating description actions'`,
			[reviewTable.wide]: reviewTable.areas,
		},
		gridTemplateColumns: {
			default: 'auto minmax(0, 1fr) auto',
			[reviewTable.wide]: reviewTable.columns,
		},
	},
	// Without a date, a narrow row has nothing left for its second line.
	descriptionOnlyWhenNarrow: {
		gridTemplateAreas: {
			default: `
				'rating description description description description'
				'. date strength . actions'
			`,
			[reviewTable.noStrength]: `'rating description actions'`,
			[reviewTable.wide]: reviewTable.areas,
		},
		gridTemplateColumns: {
			default: 'auto auto auto minmax(0, 1fr) auto',
			[reviewTable.noStrength]: 'auto minmax(0, 1fr) auto',
			[reviewTable.wide]: reviewTable.columns,
		},
	},
	// With notes, the cell holds the notes marker, so it follows the rating.
	withoutDescriptionWithNotes: {
		gridTemplateAreas: {
			default: `'rating description date strength . actions'`,
			[reviewTable.wide]: reviewTable.areas,
		},
		gridTemplateColumns: {
			default: 'auto auto auto auto minmax(0, 1fr) auto',
			[reviewTable.wide]: reviewTable.columns,
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

		minInlineSize: 0,
	},
	descriptionTrigger: {
		padding: 0,

		alignItems: 'center',
		columnGap: '6px',
		display: 'flex',
		inlineSize: '100%',
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
		minInlineSize: 0,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	// The table fills an empty description cell with a dash, matching the
	// strength column. Stacked, only the notes marker shows.
	emptyDescription: {
		alignItems: 'center',
		columnGap: '6px',
		display: 'flex',

		color: colorsSemantic.textSecondary,
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
	actions: {
		gridColumnEnd: 'actions',
		gridColumnStart: 'actions',
		gridRowEnd: 'actions',
		gridRowStart: 'actions',
	},
})

type StackedLayoutFlags = {
	hasDate: boolean
	hasDescription: boolean
	hasNotes: boolean
	hasStrength: boolean
}

/** Pick the stacked grid for what the row shows; `row` is the default. */
function stackedLayout({
	hasDate,
	hasDescription,
	hasNotes,
	hasStrength,
}: StackedLayoutFlags) {
	if (!hasDescription) {
		return hasNotes
			? styles.withoutDescriptionWithNotes
			: styles.withoutDescription
	}
	if (hasDate) return null
	return hasStrength
		? styles.descriptionOnlyWhenNarrow
		: styles.descriptionOnly
}

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
	// Raised above the row's overlay trigger so its tooltip can show.
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
				stackedLayout({
					hasDate: date !== null,
					hasDescription,
					hasNotes,
					hasStrength,
				}),
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
			<td
				role='cell'
				{...stylex.props(
					styles.cell,
					styles.description,
					!hasDescription && styles.emptyDescription,
				)}
			>
				{hasDescription ? (
					<DialogTrigger {...stylex.props(styles.descriptionTrigger)}>
						<span {...stylex.props(styles.descriptionText)}>
							{description}
						</span>
						{/* Stacked, the marker moves before the date. */}
						{notesIndicator(date !== null && styles.stackedHidden)}
					</DialogTrigger>
				) : (
					<>
						<DialogTrigger
							aria-label='Open review'
							{...stylex.props(styles.overlayTrigger)}
						/>
						{/* The row's trigger already names it "Open review". */}
						<span
							aria-hidden='true'
							{...stylex.props(styles.stackedHidden)}
						>
							—
						</span>
						{notesIndicator()}
					</>
				)}
			</td>
			<td
				role='cell'
				{...stylex.props(
					styles.cell,
					styles.whole,
					styles.date,
					// Like a pending strength, a missing date shows a dash only
					// in the table.
					date === null && [styles.stackedHidden, styles.muted],
				)}
			>
				{date === null ? (
					'—'
				) : (
					<>
						{hasDescription && notesIndicator(styles.tableHidden)}
						<ReviewDate
							date={date}
							isCompleted={review.rating !== undefined}
							xstyle={styles.raised}
						/>
					</>
				)}
			</td>
			<td
				role='cell'
				{...stylex.props(
					styles.cell,
					styles.whole,
					styles.strength,
					styles.raised,
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
