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

const styles = stylex.create({
	// Rows lay themselves out against this width, so the same list reads as a
	// table on the collection page and stacks in the narrow review queue.
	container: {
		containerType: 'inline-size',
		minInlineSize: '200px',
	},
	// Stacked, rows show only the title and actions columns, with the rest
	// under the title. Wide, the metadata columns appear. Every column but the
	// title fits its content, and the title takes the rest.
	table: {
		borderSpacing: 0,
		inlineSize: '100%',
	},
	headerRow: {
		// Contains the visually hidden column names, which are absolutely
		// positioned.
		// Otherwise they anchor to an ancestor outside the page's scroll area and
		// stretch that ancestor's scroll height. A title can also stretch over
		// the row, and isolating the row keeps the highlight it draws behind
		// the row's text but in front of whatever sits behind the table.
		isolation: 'isolate',
		position: 'relative',
	},
	headerCell: {
		padding: 0,
		// Acts as a minimum on a table cell. Stacked, only a title takes up
		// space.
		blockSize: {
			default: null,
			[wide]: '32px',
		},

		fontWeight: fontWeights.regular,
		textAlign: 'start',
	},
	// Rules off a section from the rows above it, with the title sitting just
	// over the rule rather than centered. Table rows don't draw borders, so
	// each cell draws its part of the rule.
	underlinedHeaderCell: {
		paddingBlockEnd: spacing['2xs'],
		verticalAlign: 'bottom',

		borderBlockEndColor: colorsSemantic.borderSubtle,
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
	},
	// See `CardItem`'s title cell.
	titleCell: {
		inlineSize: '100%',
		maxInlineSize: 0,
	},
	// A visible title gets a little room above the first row. Table rows take
	// no margins, so an empty row makes the room.
	titledBody: {
		'::before': {
			blockSize: spacing.xs,
			content: '""',
			display: 'table-row',
		},
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
	// so they show together. It applies inside the header cells, so the cells'
	// rule stays.
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
	// Hidden with its column when stacked. Pads the gap before the column, like
	// `CardItem`'s cells.
	label: {
		display: {
			default: 'none',
			[wide]: 'table-cell',
		},
		paddingInlineStart: spacing.lg,
		whiteSpace: 'nowrap',

		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,
	},
	// Above a title stretched over the row, so the actions stay clickable.
	headerActions: {
		position: 'relative',
		zIndex: 2,
	},
	headerActionsContent: {
		display: 'flex',
		justifyContent: 'flex-end',
	},
})

const LABELS = ['Due', 'Last reviewed', 'Strength']

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

	const headerCell = [
		styles.headerCell,
		Boolean(title) && headingLevel === 3 && styles.underlinedHeaderCell,
	]

	return (
		<div {...stylex.props(styles.container, cardTableMarker)}>
			<table {...stylex.props(styles.table)}>
				<thead>
					<tr {...stylex.props(styles.headerRow)}>
						<th {...stylex.props(headerCell, styles.titleCell)}>
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
						{LABELS.map(label => (
							<th
								key={label}
								{...stylex.props(headerCell, styles.label)}
							>
								<span {...stylex.props(styles.revealed)}>
									{label}
								</span>
							</th>
						))}
						<th {...stylex.props(headerCell)}>
							<span {...stylex.props(a11y.visuallyHidden)}>
								Status
							</span>
						</th>
						<th
							{...stylex.props(
								headerCell,
								actions !== undefined && styles.headerActions,
							)}
						>
							<span {...stylex.props(a11y.visuallyHidden)}>
								Actions
							</span>
							{actions !== undefined ? (
								<div
									{...stylex.props(
										styles.headerActionsContent,
										styles.revealed,
									)}
								>
									{actions}
								</div>
							) : null}
						</th>
					</tr>
				</thead>
				<tbody {...stylex.props(title ? styles.titledBody : null)}>
					{children}
				</tbody>
			</table>
		</div>
	)
}
