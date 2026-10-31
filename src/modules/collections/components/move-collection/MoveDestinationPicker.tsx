import * as stylex from '@stylexjs/stylex'
import { useLayoutEffect, useRef } from 'react'
import { flushSync } from 'react-dom'

import { RevealSelectionPill } from '~/modules/collections/components/RevealSelectionPill'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import { scrollFadeVars } from '~/styles/scrollFade.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import { MoveCollectionTree } from './MoveCollectionTree'
import { MoveDestinationResults } from './MoveDestinationResults'
import { MoveDestinationSearchBar } from './MoveDestinationSearchBar'
import type { MoveDestination } from './useMoveDestination'

const styles = stylex.create({
	// The border sits on the frame so the scroll fade dissolves the rows
	// without fading the border. The frame keeps one height so the dialog
	// doesn't resize as the tree, results, and messages swap in.
	frame: {
		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		overflow: 'hidden',
		blockSize: '24rem',
		display: 'flex',
		flexDirection: 'column',
	},
	// Anchors the reveal pill to the list's edges.
	listArea: {
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1,
		minBlockSize: 0,
		position: 'relative',
	},
	scrollArea: {
		flexGrow: 1,
		minBlockSize: 0,
		// Keeps revealed rows clear of the edge fades.
		scrollPaddingBlockEnd: scrollFadeVars.size,
		scrollPaddingBlockStart: scrollFadeVars.size,
		overflowY: 'auto',
	},
	treePadding: {
		padding: spacing.sm,
	},
	// Lines result text up with the search icon, as in the search dialog.
	resultsPadding: {
		paddingBlock: spacing.xs,
		paddingInline: spacing.xs,
	},
	// Lets the last row scroll above the reveal pill.
	treeWithPill: {
		paddingBlockEnd: spacing['3xl'],
	},
	status: {
		margin: 0,
		padding: spacing.sm,
		color: colorsSemantic.textSecondary,
		fontSize: fontSizes.sm,
	},
})

type MoveDestinationPickerProps = {
	allowRoot: boolean
	destination: MoveDestination
}

/** Chooses a destination by browsing the collection tree or searching. */
export function MoveDestinationPicker({
	allowRoot,
	destination,
}: MoveDestinationPickerProps) {
	const {
		collections,
		hiddenSelection,
		isSearching,
		query,
		search,
		selectedDestination,
	} = destination
	const scrollAreaRef = useRef<HTMLElement>(null)
	const findSelectedLabel = () =>
		scrollAreaRef.current?.querySelector<HTMLElement>(
			'[aria-pressed="true"]',
		)

	// The tree mounts scrolled to the top, both when the dialog opens and
	// when clearing the query brings it back, so scroll to the selection,
	// whose branch is already open by then.
	const isShowingTree = !isSearching && collections.roots.length > 0
	useLayoutEffect(() => {
		if (isShowingTree)
			findSelectedLabel()?.scrollIntoView({ block: 'nearest' })
	}, [isShowingTree])

	// The pill unmounts once the selection is revealed, so focus moves to its
	// label instead of falling back to the document. Committing the opened
	// branches synchronously makes that label focusable right away.
	const handleRevealSelection = () => {
		flushSync(destination.revealSelection)
		const label = findSelectedLabel()
		label?.focus({ preventScroll: true })
		label?.scrollIntoView({ block: 'nearest' })
	}

	const showRevealSelectionPill =
		!isSearching && hiddenSelection !== undefined

	return (
		<div {...stylex.props(styles.frame)}>
			<MoveDestinationSearchBar
				query={query}
				onQueryChange={destination.setQuery}
			/>
			<div {...stylex.props(styles.listArea)}>
				<nav
					aria-label='Destination collection'
					ref={scrollAreaRef}
					{...stylex.props(
						styles.scrollArea,
						scrollFade.y,
						isSearching
							? styles.resultsPadding
							: styles.treePadding,
					)}
				>
					{isSearching ? (
						<MoveDestinationResults
							isError={search.isError}
							isLoading={search.isLoading}
							onSelect={destination.setSelectedDestination}
							query={query}
							results={search.results}
							selectedDestination={selectedDestination}
						/>
					) : collections.isPending ? (
						<p {...stylex.props(styles.status)}>
							Loading collections…
						</p>
					) : collections.isError ? (
						<p {...stylex.props(styles.status)}>
							Could not load collections.
						</p>
					) : collections.roots.length === 0 ? (
						<p {...stylex.props(styles.status)}>
							No collections available.
						</p>
					) : (
						<MoveCollectionTree
							allowRoot={allowRoot}
							collections={collections.roots}
							onCollapseAll={destination.collapseAll}
							onCollectionOpenChange={
								destination.setCollectionOpen
							}
							onSelect={destination.setSelectedDestination}
							openCollectionIds={destination.openCollectionIds}
							selectedDestination={selectedDestination}
							xstyle={
								showRevealSelectionPill && styles.treeWithPill
							}
						/>
					)}
				</nav>
				{showRevealSelectionPill ? (
					<RevealSelectionPill
						title={hiddenSelection.title.trim() || 'Untitled'}
						onClick={handleRevealSelection}
					/>
				) : null}
			</div>
		</div>
	)
}
