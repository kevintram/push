import * as stylex from '@stylexjs/stylex'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { LoadingIndicator } from '~/components/LoadingIndicator'
import {
	Button,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { searchDialogColors } from '~/styles/colors/components.stylex'
import {
	breakpoints,
	fontSizes,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { useSearchResults } from '../hooks/useSearchResults'
import { buildCardResults, buildTopicResults } from '../utils/searchResults'
import { SearchResultGroup } from './SearchResultGroup'

const styles = stylex.create({
	viewport: {
		padding: {
			default: spacing.none,
			[breakpoints.tablet]: spacing.lg,
		},
		placeItems: {
			default: 'stretch',
			[breakpoints.tablet]: 'center',
		},
		overflowY: {
			default: 'hidden',
			[breakpoints.tablet]: 'auto',
		},
	},
	content: {
		padding: 0,
		gap: 0,
		blockSize: {
			default: '100dvh',
			[breakpoints.tablet]: '460px',
		},
		// Search bar sizes to content, results take the rest and scroll.
		gridTemplateRows: 'auto minmax(0, 1fr)',
		inlineSize: {
			default: '100dvw',
			[breakpoints.tablet]: '720px',
		},
		maxBlockSize: {
			default: 'none',
			[breakpoints.tablet]: '460px',
		},
		maxInlineSize: {
			default: 'none',
			[breakpoints.tablet]: '720px',
		},

		borderColor: searchDialogColors.popupBorder,
		borderRadius: {
			default: 0,
			[breakpoints.tablet]: radii.xl,
		},
		borderWidth: {
			default: 0,
			[breakpoints.tablet]: '1px',
		},
		backgroundColor: searchDialogColors.popupBackground,
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
		paddingBlock: spacing.sm,
		alignItems: 'center',
		display: 'flex',
		paddingInlineEnd: spacing.lg,
		paddingInlineStart: spacing.lg,

		borderBlockEndColor: searchDialogColors.headerBorder,
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
	},
	searchIcon: {
		blockSize: iconSizes.lg,
		color: searchDialogColors.searchIconForeground,
		flexShrink: 0,
		inlineSize: iconSizes.md,
	},
	closeButton: {
		flexShrink: 0,
	},
	closeIcon: {
		blockSize: iconSizes.md,
		inlineSize: iconSizes.md,
	},
	input: {
		inlineSize: '100%',
		minInlineSize: 0,

		borderWidth: 0,
		outline: 'none',
		appearance: 'none',
		backgroundColor: searchDialogColors.inputBackground,
		color: searchDialogColors.inputForeground,
		fontFamily: 'inherit',
		lineHeight: 1.4,
		// Suppresses the WebKit search clear button so `type='search'` looks
		// identical to the text input it replaced. `appearance: none` on the
		// input itself does not remove it in Chrome.
		'::-webkit-search-cancel-button': { display: 'none' },
		'::placeholder': {
			color: searchDialogColors.inputPlaceholderForeground,
		},
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
		alignItems: 'center',
		color: searchDialogColors.statusForeground,
		display: 'flex',
		fontSize: fontSizes.md,
		justifyContent: 'center',
		minBlockSize: '100%',
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
		<DialogContent
			showCloseButton={false}
			viewportXstyle={styles.viewport}
			xstyle={styles.content}
		>
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
				<Tooltip>
					<TooltipTrigger
						render={
							<DialogClose
								render={
									<Button.Icon
										aria-label='Close search'
										size='small'
										variant='ghost'
										xstyle={styles.closeButton}
									/>
								}
							>
								<X
									aria-hidden='true'
									{...stylex.props(styles.closeIcon)}
								/>
							</DialogClose>
						}
					/>
					<TooltipContent>Close</TooltipContent>
				</Tooltip>
			</div>

			<div {...stylex.props(styles.results)}>
				{!hasQuery ? (
					<p {...stylex.props(styles.status)}>
						Search topics and review cards
					</p>
				) : isLoading ? (
					<LoadingIndicator />
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
