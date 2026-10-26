import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

// StyleX's dev server only resolves shared constants through the `~` alias.
import {
	cardTable,
	cardTableMarker,
} from '~/modules/reviews/components/cardTable.stylex'
import { a11y } from '~/styles/a11y'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights, layout, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	// Rows lay themselves out against this width, so the same list reads as a
	// table on the collection page and stacks in the narrow review queue.
	container: {
		containerType: 'inline-size',
		minInlineSize: '200px',
	},
	// Wide, the table owns the columns and every row group and row joins
	// them through subgrid.
	table: {
		columnGap: spacing.lg,
		display: {
			default: 'block',
			[cardTable.wide]: 'grid',
		},
		gridTemplateColumns: {
			default: null,
			[cardTable.wide]: cardTable.columns,
		},
	},
	group: {
		display: {
			default: 'block',
			[cardTable.wide]: 'grid',
		},
		gridColumnEnd: {
			default: null,
			[cardTable.wide]: '-1',
		},
		gridColumnStart: {
			default: null,
			[cardTable.wide]: '1',
		},
		gridTemplateColumns: {
			default: null,
			[cardTable.wide]: 'subgrid',
		},
	},
	headerRow: {
		alignItems: 'center',
		display: {
			default: 'block',
			[cardTable.wide]: 'grid',
		},
		gridColumnEnd: {
			default: null,
			[cardTable.wide]: '-1',
		},
		gridColumnStart: {
			default: null,
			[cardTable.wide]: '1',
		},
		gridTemplateColumns: {
			default: null,
			[cardTable.wide]: 'subgrid',
		},
		// Stacked, only a title takes up space.
		minBlockSize: {
			default: null,
			[cardTable.wide]: '32px',
		},

		marginInline: `calc(${layout.rowBleed} * -1)`,
		paddingInline: layout.rowBleed,
	},
	headerCell: {
		padding: 0,
		fontWeight: fontWeights.regular,
		textAlign: 'start',
	},
	title: {
		margin: 0,

		color: colorsSemantic.textPrimary,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.semibold,
	},
	// Shown while the table is hovered or holds keyboard focus. Always shown
	// on touch, where there is no hover to reveal it. Stacked, the labels are
	// visually hidden rather than removed, so screen readers still name each
	// cell. Mirrors `a11y.visuallyHidden`, which can't sit behind a container
	// query.
	label: {
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.xs,
		opacity: {
			default: null,
			'@media (hover: hover)': {
				default: '0',
				[stylex.when.ancestor(':has(:focus-visible)', cardTableMarker)]:
					1,
				[stylex.when.ancestor(':hover', cardTableMarker)]: 1,
			},
		},

		blockSize: {
			default: '1px',
			[cardTable.wide]: 'auto',
		},
		clip: {
			default: 'rect(0 0 0 0)',
			[cardTable.wide]: 'auto',
		},
		clipPath: {
			default: 'inset(50%)',
			[cardTable.wide]: 'none',
		},
		inlineSize: {
			default: '1px',
			[cardTable.wide]: 'auto',
		},
		position: {
			default: 'absolute',
			[cardTable.wide]: 'static',
		},
		whiteSpace: 'nowrap',
		overflowX: {
			default: 'hidden',
			[cardTable.wide]: 'visible',
		},
		overflowY: {
			default: 'hidden',
			[cardTable.wide]: 'visible',
		},
	},
	due: { gridColumnStart: '2' },
	lastReviewed: { gridColumnStart: '3' },
	strength: { gridColumnStart: '4' },
	actions: { gridColumnStart: '5' },
})

const LABELS = [
	{ column: 'due', label: 'Due' },
	{ column: 'lastReviewed', label: 'Last reviewed' },
	{ column: 'strength', label: 'Strength' },
] as const

type CardListProps = {
	/** A visible heading over the title column. */
	title?: string
	/** Rows, as `CardItem`s. */
	children: ReactNode
}

/** Cards as a table that stacks into a list when narrow. */
export function CardList({ title, children }: CardListProps) {
	return (
		<div {...stylex.props(styles.container, cardTableMarker)}>
			{/* The table's block and grid layout can drop its native roles, so name them. */}
			<table role='table' {...stylex.props(styles.table)}>
				<thead role='rowgroup' {...stylex.props(styles.group)}>
					<tr role='row' {...stylex.props(styles.headerRow)}>
						<th
							role='columnheader'
							{...stylex.props(styles.headerCell)}
						>
							{title ? (
								<h2 {...stylex.props(styles.title)}>{title}</h2>
							) : (
								<span {...stylex.props(a11y.visuallyHidden)}>
									Card
								</span>
							)}
						</th>
						{LABELS.map(({ column, label }) => (
							<th
								key={column}
								role='columnheader'
								{...stylex.props(
									styles.headerCell,
									styles.label,
									styles[column],
								)}
							>
								{label}
							</th>
						))}
						<th
							role='columnheader'
							{...stylex.props(styles.headerCell, styles.actions)}
						>
							<span {...stylex.props(a11y.visuallyHidden)}>
								Actions
							</span>
						</th>
					</tr>
				</thead>
				<tbody role='rowgroup' {...stylex.props(styles.group)}>
					{children}
				</tbody>
			</table>
		</div>
	)
}
