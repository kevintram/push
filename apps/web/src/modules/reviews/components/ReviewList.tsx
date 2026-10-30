import * as stylex from '@stylexjs/stylex'

import { a11y } from '~/styles/a11y'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import type { Review as ReviewModel } from '../types/review.types'
import { Review } from './Review'

// A local string, not a shared constant: StyleX can leave an imported
// at-rule key unresolved in dev, emitting invalid CSS.
// See `ReviewRow`.
const wide = '@container (min-width: 440px)'

const styles = stylex.create({
	// Rows lay themselves out against this width, so the same table reads as a
	// table on the card page and stacks in the narrow card sidebar. Below the
	// minimum, a stacked row's details line no longer fits.
	container: {
		containerType: 'inline-size',
		minInlineSize: '200px',
	},
	// Stacked rows sit apart. Table rows take no margins, so the table spaces
	// them, and pulls in its edges to drop the spacing above the first row and
	// below the last. Wide, every column but the description fits its content,
	// and the description takes the rest.
	table: {
		marginBlock: {
			default: `calc(${spacing.md} * -1)`,
			[wide]: 0,
		},
		borderSpacing: {
			default: `0 ${spacing.md}`,
			[wide]: 0,
		},
		inlineSize: '100%',
	},
	// Stacked, the headers are visually hidden rather than removed, so screen
	// readers still name each cell. Mirrors `a11y.visuallyHidden`, which can't
	// sit behind a container query. Out of flow, the header also takes none of
	// the table's row spacing.
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
		inlineSize: {
			default: '1px',
			[wide]: 'auto',
		},
		position: {
			default: 'absolute',
			[wide]: 'static',
		},
		whiteSpace: 'nowrap',
		overflowX: {
			default: 'hidden',
			[wide]: 'visible',
		},
		overflowY: {
			default: 'hidden',
			[wide]: 'visible',
		},
	},
	headerCell: {
		padding: 0,
		// Acts as a minimum on a table cell.
		blockSize: '32px',

		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
		textAlign: 'start',
	},
	// Matches the gap `ReviewRow` pads before every cell after the rating's.
	gap: {
		paddingInlineStart: spacing.lg,
	},
	// See `ReviewRow`'s description cell.
	description: {
		inlineSize: '100%',
		maxInlineSize: 0,
	},
})

// The icon columns need no visible header, only a name for screen readers.
const COLUMNS = [
	{ isIconColumn: true, label: 'Rating' },
	{ isIconColumn: false, label: 'Description', xstyle: styles.description },
	{ isIconColumn: true, label: 'Notes' },
	{ isIconColumn: false, label: 'Date' },
	{ isIconColumn: false, label: 'Strength' },
	{ isIconColumn: true, label: 'Actions' },
]

type ReviewListProps = {
	reviews: Array<ReviewModel>
}

export function ReviewList({ reviews }: ReviewListProps) {
	return (
		<div {...stylex.props(styles.container)}>
			<table {...stylex.props(styles.table)}>
				<thead {...stylex.props(styles.head)}>
					<tr>
						{COLUMNS.map((column, index) => (
							<th
								key={column.label}
								{...stylex.props(
									styles.headerCell,
									index > 0 && styles.gap,
									column.xstyle,
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
				<tbody>
					{reviews.map(review => (
						<Review key={review._id} review={review} />
					))}
				</tbody>
			</table>
		</div>
	)
}
