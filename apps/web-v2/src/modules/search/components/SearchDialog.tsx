import * as stylex from '@stylexjs/stylex'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { DialogContent, DialogDescription, DialogTitle } from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { useSearchResults } from '../hooks/useSearchResults'
import { buildCardResults, buildTopicResults } from '../utils/searchResults'
import { SearchResultGroup } from './SearchResultGroup'

const styles = stylex.create({
	content: {
		padding: 0,
		gap: 0,
		// Search bar sizes to content, results take the rest and scroll.
		gridTemplateRows: 'auto minmax(0, 1fr)',
		maxBlockSize: 'min(76dvh, 46rem)',
		maxInlineSize: '42rem',

		borderColor: colors.borderSecondary,
		borderRadius: radii.xl,
		backgroundColor: colors.bg,
		overflowX: 'hidden',
		overflowY: 'hidden',
	},
	visuallyHidden: {
		blockSize: '1px',
		clip: 'rect(0 0 0 0)',
		clipPath: 'inset(50%)',
		inlineSize: '1px',
		position: 'absolute',
		whiteSpace: 'nowrap',
		overflowX: 'hidden',
		overflowY: 'hidden',
	},
	searchBar: {
		gap: spacing.sm,
		paddingBlock: spacing.lg,
		alignItems: 'center',
		display: 'flex',
		paddingInlineEnd: '52px',
		paddingInlineStart: spacing.lg,

		borderBlockEndColor: colors.borderSecondary,
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
	},
	searchIcon: {
		blockSize: iconSizes.lg,
		color: colors.textSecondary,
		flexShrink: 0,
		inlineSize: iconSizes.lg,
	},
	input: {
		inlineSize: '100%',
		minInlineSize: 0,

		borderWidth: 0,
		outline: 'none',
		appearance: 'none',
		backgroundColor: colors.bgSurfaceTransparent,
		color: colors.text,
		fontFamily: 'inherit',
		fontSize: fontSizes.xl,
		lineHeight: 1.4,
		// Suppresses the WebKit search clear button so `type='search'` looks
		// identical to the text input it replaced. `appearance: none` on the
		// input itself does not remove it in Chrome.
		'::-webkit-search-cancel-button': { display: 'none' },
		'::placeholder': { color: colors.textSecondary },
	},
	results: {
		// The grid row is the scroll container, so this needs `minBlockSize: 0`
		// to be allowed to shrink below its content height.
		minBlockSize: 0,
		paddingBlockEnd: spacing.xs,
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	status: {
		paddingBlock: spacing['2xl'],
		paddingInline: spacing.xl,
		color: colors.textSecondary,
		fontSize: fontSizes.md,
		textAlign: 'center',
	},
})

type ExpandedGroup = 'cards' | 'topics' | null

/**
 * Mounted only while the dialog is open, so the query state resets on close.
 */
export function SearchDialog() {
	const { isError, isLoading, query, reviewCards, setQuery, topics } =
		useSearchResults()

	const [expandedGroup, setExpandedGroup] = useState<ExpandedGroup>(null)
	const topicResults = useMemo(() => buildTopicResults(topics), [topics])
	const cardResults = useMemo(
		() => buildCardResults(reviewCards, query),
		[query, reviewCards],
	)

	const hasQuery = query.trim() !== ''
	const hasResults = topicResults.length > 0 || cardResults.length > 0
	const queryStatus = !hasQuery
		? 'Search is ready.'
		: isLoading
			? 'Searching.'
			: isError
				? 'Search could not load. Try again.'
				: `${topicResults.length} topics and ${cardResults.length} cards found.`

	return (
		<DialogContent xstyle={styles.content} showCloseButton={false}>
			<DialogTitle xstyle={styles.visuallyHidden}>Search</DialogTitle>
			<DialogDescription xstyle={styles.visuallyHidden}>
				Search your topics and review cards.
			</DialogDescription>
			<p aria-live='polite' {...stylex.props(styles.visuallyHidden)}>
				{queryStatus}
			</p>

			<div {...stylex.props(styles.searchBar)}>
				<Search
					aria-hidden='true'
					{...stylex.props(styles.searchIcon)}
				/>
				<input
					aria-label='Search topics and review cards'
					autoComplete='off'
					enterKeyHint='search'
					onChange={event => {
						setExpandedGroup(null)
						setQuery(event.target.value)
					}}
					placeholder='Search…'
					// `type='search'` carries the `searchbox` role implicitly.
					type='search'
					value={query}
					{...stylex.props(styles.input)}
				/>
			</div>

			<div {...stylex.props(styles.results)}>
				{!hasQuery ? (
					// TODO: display recent results when no query
					<p {...stylex.props(styles.status)}>
						Type to search your library.
					</p>
				) : isLoading ? (
					<p {...stylex.props(styles.status)}>Searching…</p>
				) : isError ? (
					<p {...stylex.props(styles.status)}>
						Search could not load. Try again.
					</p>
				) : !hasResults ? (
					<p {...stylex.props(styles.status)}>
						No results for “{query.trim()}”.
					</p>
				) : (
					<>
						{/*
						Only one group can be expanded at a time, and
						expanding one hides the other so the expanded
						group gets the full scroll area. With nothing
						expanded, both render a truncated preview.
						*/}
						{expandedGroup !== 'cards' ? (
							<SearchResultGroup
								expanded={expandedGroup === 'topics'}
								label='Topics'
								onExpandedChange={expanded =>
									setExpandedGroup(expanded ? 'topics' : null)
								}
								results={topicResults}
							/>
						) : null}
						{expandedGroup !== 'topics' ? (
							<SearchResultGroup
								expanded={expandedGroup === 'cards'}
								label='Cards'
								onExpandedChange={expanded =>
									setExpandedGroup(expanded ? 'cards' : null)
								}
								results={cardResults}
							/>
						) : null}
					</>
				)}
			</div>
		</DialogContent>
	)
}
