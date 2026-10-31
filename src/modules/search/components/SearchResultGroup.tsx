import * as stylex from '@stylexjs/stylex'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'

import { Button } from '~/components/ui/Button'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
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
	// An expanded group fills the results area and scrolls only its list, so
	// the header stays put above the scroll fade instead of under it.
	sectionExpanded: {
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
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
	title: {
		color: colorsSemantic.textSecondary,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.semibold,
	},
	control: {
		color: colorsSemantic.textSecondary,
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
	listExpanded: {
		flexGrow: 1,
		minBlockSize: 0,
		overflowX: 'hidden',
		overflowY: 'auto',
	},
})

/** `results` is never empty: the dialog drops a group with no hits. */
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
		<section
			aria-labelledby={headingId}
			{...stylex.props(
				styles.section,
				expanded && styles.sectionExpanded,
			)}
		>
			<div {...stylex.props(styles.header)}>
				<h2 id={headingId} {...stylex.props(styles.title)}>
					{`${label} (${results.length})`}
				</h2>
				{canToggle ? (
					<Button
						aria-expanded={expanded}
						onClick={() => onExpandedChange(!expanded)}
						shape='round'
						size='small'
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

			<ul
				{...stylex.props(
					styles.list,
					expanded && [styles.listExpanded, scrollFade.y],
				)}
			>
				{visibleResults.map(result => (
					<SearchResultItem key={result.id} result={result} />
				))}
			</ul>
		</section>
	)
}
