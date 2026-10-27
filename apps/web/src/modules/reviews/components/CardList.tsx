import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

// StyleX's dev server only resolves shared constants through the `~` alias.
import { cardTableMarker } from '~/modules/reviews/components/cardTable.stylex'
import { a11y } from '~/styles/a11y'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

// A local string, not a shared constant: StyleX can leave an imported
// at-rule key unresolved in dev, emitting invalid CSS.
const wide = '@container (min-width: 560px)'
// Title, due, last reviewed, strength, and actions. The actions column sizes
// to the widest row, since rows show a toggle per active state.
const columns = 'minmax(0, 1fr) 112px 112px 80px max-content'

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
		// Stacked, the header cell lays out as a table cell, which would pick up
		// the default spacing and push the title off the row titles.
		borderSpacing: 0,
		columnGap: spacing.lg,
		display: {
			default: 'block',
			[wide]: 'grid',
		},
		gridTemplateColumns: {
			default: null,
			[wide]: columns,
		},
	},
	group: {
		display: {
			default: 'block',
			[wide]: 'grid',
		},
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
	},
	headerRow: {
		alignItems: 'center',
		display: {
			default: 'block',
			[wide]: 'grid',
		},
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
		// Stacked, only a title takes up space.
		minBlockSize: {
			default: null,
			[wide]: '32px',
		},
		// Contains the visually hidden labels, which are absolutely positioned.
		// Otherwise they anchor to an ancestor outside the page's scroll area and
		// stretch that ancestor's scroll height.
		position: 'relative',
	},
	// A visible title gets a little room above the first row.
	titledHeaderRow: {
		marginBlockEnd: spacing.xs,
	},
	// Rules off a section from the rows above it, with the title sitting just
	// over the rule rather than centered.
	underlinedHeaderRow: {
		alignItems: 'end',
		paddingBlockEnd: spacing['2xs'],

		borderBlockEndColor: colorsSemantic.borderSubtle,
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
	},
	headerCell: {
		padding: 0,
		fontWeight: fontWeights.regular,
		textAlign: 'start',
	},
	title: {
		margin: 0,

		color: colorsSemantic.textPrimary,
		fontWeight: fontWeights.semibold,
	},
	// The list's own heading, such as a collection's "Cards".
	h2: {
		fontSize: fontSizes.xl,
		letterSpacing: '-0.01em',
	},
	// A subdivision of a level 2 list, such as a collection's section.
	h3: {
		fontSize: fontSizes.md,
	},
	// Shown while the table is hovered, holds keyboard focus, or has a popup
	// open, such as a header action's menu. Always shown on touch, where there
	// is no hover to reveal it. The column labels and header actions share it,
	// so they show together.
	revealed: {
		opacity: {
			default: null,
			'@media (hover: hover)': {
				default: '0',
				[stylex.when.ancestor(':has(:focus-visible)', cardTableMarker)]:
					1,
				[stylex.when.ancestor(
					':has([data-popup-open])',
					cardTableMarker,
				)]: 1,
				[stylex.when.ancestor(':hover', cardTableMarker)]: 1,
			},
		},
	},
	// Stacked, the labels are visually hidden rather than removed, so screen
	// readers still name each cell. Mirrors `a11y.visuallyHidden`, which can't
	// sit behind a container query.
	label: {
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,

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
	headerActions: {
		display: 'flex',
		justifyContent: 'flex-end',
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
	/** A visible heading over the title column, such as text or an editable title. */
	title?: ReactNode
	/** The title's heading level. Defaults to 2. */
	headingLevel?: 2 | 3
	/** Controls for the whole list, over the row actions column. */
	actions?: ReactNode
	/** Rows, as `CardItem`s. */
	children: ReactNode
}

/** Cards as a table that stacks into a list when narrow. */
export function CardList({
	title,
	headingLevel = 2,
	actions,
	children,
}: CardListProps) {
	const Heading = headingLevel === 3 ? 'h3' : 'h2'

	return (
		<div {...stylex.props(styles.container, cardTableMarker)}>
			{/* The table's block and grid layout can drop its native roles, so name them. */}
			<table role='table' {...stylex.props(styles.table)}>
				<thead role='rowgroup' {...stylex.props(styles.group)}>
					<tr
						role='row'
						{...stylex.props(
							styles.headerRow,
							title ? styles.titledHeaderRow : null,
							title && headingLevel === 3
								? styles.underlinedHeaderRow
								: null,
						)}
					>
						<th
							role='columnheader'
							{...stylex.props(styles.headerCell)}
						>
							{title ? (
								<Heading
									{...stylex.props(
										styles.title,
										styles[Heading],
									)}
								>
									{title}
								</Heading>
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
									styles.revealed,
									styles[column],
								)}
							>
								{label}
							</th>
						))}
						<th
							role='columnheader'
							{...stylex.props(
								styles.headerCell,
								styles.actions,
								actions !== undefined && [
									styles.headerActions,
									styles.revealed,
								],
							)}
						>
							<span {...stylex.props(a11y.visuallyHidden)}>
								Actions
							</span>
							{actions}
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
