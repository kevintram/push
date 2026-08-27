import * as stylex from '@stylexjs/stylex'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'

import { Button } from '~/components/ui/Button'
import {
	searchDialogColors,
	searchResultGroupColors,
} from '~/styles/colors/components.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

import type { SearchResultItem as SearchResultItemModel } from '../utils/searchResults'
import { SearchResultItem } from './SearchResultItem'

const PREVIEW_COUNT = 3

const styles = stylex.create({
	section: {
		paddingInline: spacing.xs,
		paddingBlockEnd: spacing.sm,
		paddingBlockStart: spacing.lg,
	},
	header: {
		paddingBlock: spacing.xs,
		// Matches the inline padding of a result link so the heading sits on
		// the same text edge as the titles below it.
		paddingInline: spacing.md,
		alignItems: 'center',
		display: 'flex',
		minBlockSize: '32px',
	},
	headerExpanded: {
		backgroundColor: searchDialogColors.popupBackground,
		insetBlockStart: 0,
		position: 'sticky',
		zIndex: 1,
	},
	title: {
		color: searchResultGroupColors.titleForeground,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.regular,
	},
	control: {
		color: searchResultGroupColors.controlForeground,
		fontSize: fontSizes.xs,
	},
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
	},
	list: {
		margin: 0,
		padding: 0,
		display: 'flex',
		flexDirection: 'column',
	},
	empty: {
		paddingBlock: spacing.lg,
		paddingInline: spacing.md,
		color: searchResultGroupColors.emptyForeground,
		fontSize: fontSizes.sm,
	},
})

type SearchResultGroupProps = {
	expanded: boolean
	label: string
	onExpandedChange: (expanded: boolean) => void
	results: Array<SearchResultItemModel>
}

export function SearchResultGroup({
	expanded,
	label,
	onExpandedChange,
	results,
}: SearchResultGroupProps) {
	const visibleResults = expanded ? results : results.slice(0, PREVIEW_COUNT)
	const canToggle = expanded || results.length > PREVIEW_COUNT
	const headingId = `search-${label.toLowerCase()}-heading`

	return (
		<section aria-labelledby={headingId} {...stylex.props(styles.section)}>
			<div
				{...stylex.props(
					styles.header,
					expanded && styles.headerExpanded,
				)}
			>
				<h2 id={headingId} {...stylex.props(styles.title)}>
					{`${label} (${results.length})`}
				</h2>
				{canToggle ? (
					<Button
						aria-expanded={expanded}
						onClick={() => onExpandedChange(!expanded)}
						shape='round'
						size='tiny'
						variant={expanded ? 'secondary' : 'ghost'}
						xstyle={styles.control}
					>
						{expanded ? (
							<ChevronsDownUp
								aria-hidden='true'
								{...stylex.props(styles.icon)}
							/>
						) : (
							<ChevronsUpDown
								aria-hidden='true'
								{...stylex.props(styles.icon)}
							/>
						)}
						{expanded ? 'Collapse' : 'View all'}
					</Button>
				) : null}
			</div>

			{visibleResults.length === 0 ? (
				<p {...stylex.props(styles.empty)}>
					No matching {label.toLowerCase()}.
				</p>
			) : (
				<ul {...stylex.props(styles.list)}>
					{visibleResults.map(result => (
						<SearchResultItem key={result.id} result={result} />
					))}
				</ul>
			)}
		</section>
	)
}
