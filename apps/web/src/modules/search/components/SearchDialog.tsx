import * as stylex from '@stylexjs/stylex'
import { formatForDisplay, useHotkey } from '@tanstack/react-hotkeys'
import { Search, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { LoadingIndicator } from '~/components/LoadingIndicator'
import { SidebarIconButton } from '~/components/sidebar'
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
	Kbd,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { searchDialogColors } from '~/styles/colors/components.stylex'
import { scrollFade } from '~/styles/scrollFade'
import {
	breakpoints,
	fontSizes,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

import { useSearchResults } from '../hooks/useSearchResults'
import { SEARCH_HOTKEY } from '../searchHotkey'
import {
	buildCardResults,
	buildCollectionResults,
} from '../utils/searchResults'
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
		blockSize: iconSizes.sm,
		color: searchDialogColors.searchIconForeground,
		flexShrink: 0,
		inlineSize: iconSizes.sm,
	},
	actionButton: {
		flexShrink: 0,
	},
	clearButtonHidden: {
		visibility: 'hidden',
	},
	closeIcon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
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

type ExpandedGroup = 'cards' | 'collections' | null

export function SearchDialog() {
	const [isOpen, setIsOpen] = useState(false)
	const { isError, isLoading, query, cards, setQuery, collections } =
		useSearchResults()
	const inputRef = useRef<HTMLInputElement>(null)

	const [expandedGroup, setExpandedGroup] = useState<ExpandedGroup>(null)

	useHotkey(SEARCH_HOTKEY, () => setIsOpen(true), {
		ignoreInputs: false,
		preventDefault: true,
		requireReset: true,
	})

	const handleClear = () => {
		setExpandedGroup(null)
		setQuery('')
		inputRef.current?.focus()
	}

	// The query survives a close, so select it on open: typing replaces the
	// stale query, while an arrow key or a click collapses the selection and
	// keeps it. `select()` is not specified to focus, so the returned element
	// is what actually moves focus.
	const handleInitialFocus = () => {
		inputRef.current?.select()
		return inputRef.current
	}

	const collectionResults = useMemo(
		() => buildCollectionResults(collections),
		[collections],
	)
	const cardResults = useMemo(
		() => buildCardResults(cards, query),
		[query, cards],
	)

	const hasQuery = query.trim() !== ''
	const hasInput = query !== ''
	const hasResults = collectionResults.length > 0 || cardResults.length > 0
	const queryStatus = !hasQuery
		? 'Search is ready.'
		: isLoading
			? 'Searching.'
			: isError
				? 'Search could not load. Try again.'
				: `${collectionResults.length} collections and ${cardResults.length} cards found.`

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<TooltipTrigger
					render={
						<DialogTrigger
							render={
								<SidebarIconButton
									aria-label='Search'
									icon={Search}
								/>
							}
						/>
					}
				/>
				<TooltipContent side='right'>
					Search
					<Kbd>{formatForDisplay(SEARCH_HOTKEY)}</Kbd>
				</TooltipContent>
			</Tooltip>
			<DialogContent
				initialFocus={handleInitialFocus}
				showCloseButton={false}
				viewportXstyle={styles.viewport}
				xstyle={styles.content}
			>
				<DialogTitle xstyle={styles.visuallyHidden}>Search</DialogTitle>
				<DialogDescription xstyle={styles.visuallyHidden}>
					Search your collections and cards.
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
						aria-label='Search collections and cards'
						autoComplete='off'
						enterKeyHint='search'
						onChange={event => {
							setExpandedGroup(null)
							setQuery(event.target.value)
						}}
						ref={inputRef}
						placeholder='Search…'
						// `type='search'` carries the `searchbox` role implicitly.
						type='search'
						value={query}
						{...stylex.props(styles.input)}
					/>
					<Button
						aria-hidden={!hasInput}
						aria-label='Clear search'
						disabled={!hasInput}
						onClick={handleClear}
						size='small'
						variant='ghost'
						xstyle={[
							styles.actionButton,
							!hasInput && styles.clearButtonHidden,
						]}
					>
						Clear
					</Button>
					<Tooltip>
						<TooltipTrigger
							render={
								<DialogClose
									render={
										<Button.Icon
											aria-label='Close search'
											size='small'
											variant='ghost'
											xstyle={styles.actionButton}
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

				<div {...stylex.props(styles.results, scrollFade.y)}>
					{!hasQuery ? (
						<p {...stylex.props(styles.status)}>
							Search collections and cards
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
						expanded, both render a truncated preview. A
						group with no hits is dropped entirely; both
						being empty is handled by `hasResults` above.
						*/}
							{expandedGroup !== 'cards' &&
							collectionResults.length > 0 ? (
								<SearchResultGroup
									expanded={expandedGroup === 'collections'}
									label='Collections'
									onExpandedChange={expanded =>
										setExpandedGroup(
											expanded ? 'collections' : null,
										)
									}
									results={collectionResults}
								/>
							) : null}
							{expandedGroup !== 'collections' &&
							cardResults.length > 0 ? (
								<SearchResultGroup
									expanded={expandedGroup === 'cards'}
									label='Cards'
									onExpandedChange={expanded =>
										setExpandedGroup(
											expanded ? 'cards' : null,
										)
									}
									results={cardResults}
								/>
							) : null}
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
