import * as stylex from '@stylexjs/stylex'

// StyleX's dev server only resolves shared constants through the `~` alias.
import { reviewTable } from '~/modules/reviews/components/reviewTable.stylex'
import { a11y } from '~/styles/a11y'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import type { Review as ReviewModel } from '../types/review.types'
import { Review } from './Review'

// A local string, not a shared constant: StyleX can leave an imported
// at-rule key unresolved in dev, emitting invalid CSS.
const wide = '@container (min-width: 560px)'

const styles = stylex.create({
	// Rows lay themselves out against this width, so the same table reads as a
	// table on the card page and stacks in the narrow card sidebar. Below the
	// minimum, a stacked row's date line no longer fits.
	container: {
		containerType: 'inline-size',
		minInlineSize: '200px',
	},
	table: {
		display: 'block',
	},
	// Stacked, the headers are visually hidden rather than removed, so screen
	// readers still name each cell. Mirrors `a11y.visuallyHidden`, which can't
	// sit behind a container query.
	head: {
		blockSize: {
			default: '1px',
			[wide]: 'auto',
		},
		clip: {
			default: 'rect(0 0 0 0)',
			[wide]: 'auto',
		},
		clipPath: {
			default: 'inset(50%)',
			[wide]: 'none',
		},
		display: 'block',
		inlineSize: {
			default: '1px',
			[wide]: 'auto',
		},
		position: {
			default: 'absolute',
			[wide]: 'static',
		},
		whiteSpace: {
			default: 'nowrap',
			[wide]: 'normal',
		},
		overflowX: {
			default: 'hidden',
			[wide]: 'visible',
		},
		overflowY: {
			default: 'hidden',
			[wide]: 'visible',
		},
	},

	body: {
		display: 'flex',
		flexDirection: 'column',
		rowGap: {
			default: spacing.md,
			[wide]: spacing.none,
		},
	},
	headerRow: {
		gridTemplateAreas: reviewTable.areas,
		alignItems: 'center',
		blockSize: '32px',
		columnGap: spacing.lg,
		display: 'grid',
		gridTemplateColumns: reviewTable.columns,

		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
	},
	headerCell: {
		padding: 0,
		textAlign: 'start',
	},
	rating: {
		gridColumnEnd: 'rating',
		gridColumnStart: 'rating',
	},
	description: {
		gridColumnEnd: 'description',
		gridColumnStart: 'description',
	},
	notes: {
		gridColumnEnd: 'notes',
		gridColumnStart: 'notes',
	},
	date: {
		gridColumnEnd: 'date',
		gridColumnStart: 'date',
	},
	strength: {
		gridColumnEnd: 'strength',
		gridColumnStart: 'strength',
	},
	actions: {
		gridColumnEnd: 'actions',
		gridColumnStart: 'actions',
	},
})

// The icon columns need no visible header, only a name for screen readers.
const COLUMNS = [
	{ area: 'rating', isIconColumn: true, label: 'Rating' },
	{ area: 'description', isIconColumn: false, label: 'Description' },
	{ area: 'notes', isIconColumn: true, label: 'Notes' },
	{ area: 'date', isIconColumn: false, label: 'Date' },
	{ area: 'strength', isIconColumn: false, label: 'Strength' },
	{ area: 'actions', isIconColumn: true, label: 'Actions' },
] as const

type ReviewListProps = {
	reviews: Array<ReviewModel>
}

export function ReviewList({ reviews }: ReviewListProps) {
	return (
		<div {...stylex.props(styles.container)}>
			{/* The table's block and grid layout can drop its native roles, so name them. */}
			<table role='table' {...stylex.props(styles.table)}>
				<thead role='rowgroup' {...stylex.props(styles.head)}>
					<tr role='row' {...stylex.props(styles.headerRow)}>
						{COLUMNS.map(column => (
							<th
								key={column.label}
								role='columnheader'
								{...stylex.props(
									styles.headerCell,
									styles[column.area],
								)}
							>
								{column.isIconColumn ? (
									<span
										{...stylex.props(a11y.visuallyHidden)}
									>
										{column.label}
									</span>
								) : (
									column.label
								)}
							</th>
						))}
					</tr>
				</thead>
				<tbody role='rowgroup' {...stylex.props(styles.body)}>
					{reviews.map(review => (
						<Review key={review._id} review={review} />
					))}
				</tbody>
			</table>
		</div>
	)
}
