import type { Id } from '@convex/_generated/dataModel'
import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { ChevronsDownUp, Plus } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import {
	SidebarCollapsibleActions,
	SidebarCollapsibleContent,
	SidebarCollapsibleHeader,
	SidebarCollapsibleItem,
	SidebarCollapsibleTrigger,
	SidebarItem,
} from '~/components/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger, Tree } from '~/components/ui'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { scrollFade } from '~/styles/scrollFade'
import { scrollFadeVars } from '~/styles/scrollFade.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'
import { readStoredBoolean, writeStoredBoolean } from '~/utils/storage'

import { useCreateCollection } from '../../api/collectionQueries'
import type { CollectionWithChildren } from '../../types/collection.types'
import {
	type CollectionOpenChangeHandler,
	LibraryCollectionItem,
} from './LibraryCollectionItem'
import { RevealSelectionPill } from './RevealSelectionPill'

const LIBRARY_NAVIGATION_STORAGE_KEY = 'libraryNavigationOpen'

const styles = stylex.create({
	container: {
		borderRadius: radii.lg,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100%',
		height: '100%',
		minHeight: 0,
	},
	// Anchors the reveal pill to the list's edges rather than the section's.
	listArea: {
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1,
		position: 'relative',
		minHeight: 0,
	},
	containerIsDropTarget: {
		backgroundColor: semanticColors.surfaceTransparentHover,
	},
	nav: {
		paddingBlock: 0,
		paddingInline: 0,
		display: 'flex',
		flexBasis: 0,
		flexDirection: 'column',
		flexGrow: 1,
		flexShrink: 1,
		inlineSize: '100%',
		minHeight: 0,
	},
	// Scrolls inside the collapsible panel rather than as the panel. Base UI
	// treats any animation on the panel as its open/close animation, which
	// would disable the scroll fade.
	scrollArea: {
		flexGrow: 1,
		// Keeps focused and revealed rows clear of the edge fades.
		scrollPaddingBlockEnd: scrollFadeVars.size,
		scrollPaddingBlockStart: scrollFadeVars.size,
		minHeight: 0,
		overflowY: 'auto',
	},
	// Lets the last row scroll above the reveal pill.
	collectionTreeWithPill: {
		paddingBlockEnd: spacing['3xl'],
	},
})

type LibraryNavigationContentProps = {
	collections: ReadonlyArray<CollectionWithChildren>
	openCollectionIds: ReadonlySet<Id<'collections'>>
	onCollectionOpenChange: CollectionOpenChangeHandler
	onCollapseAll: () => void
	/** The selected collection while a collapsed ancestor hides it in the tree. */
	hiddenSelection?: CollectionWithChildren
	onRevealSelection: () => void
}

/**
 * Owns the sidebar UI and root droppable state. The root state highlights the
 * entire sidebar while its ref is attached to the header element as the root
 * drop target.
 */
export function LibraryNavigationContent({
	collections,
	openCollectionIds,
	onCollectionOpenChange,
	onCollapseAll,
	hiddenSelection,
	onRevealSelection,
}: LibraryNavigationContentProps) {
	const createCollection = useCreateCollection()
	const navigate = useNavigate()
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const [isOpen, setIsOpen] = useState(() =>
		readStoredBoolean(LIBRARY_NAVIGATION_STORAGE_KEY, true),
	)

	const { ref: libraryRootRef, isDropTarget: libraryRootIsDropTarget } =
		useDroppable({ id: 'library-root' })

	const handleCreateCollection = useCallback(() => {
		createCollection.mutate(
			{},
			{
				onSuccess: collectionId =>
					navigate({
						to: '/library/$collectionId',
						params: { collectionId },
					}),
			},
		)
	}, [navigate, createCollection])

	const handleOpenChange = useCallback((open: boolean) => {
		setIsOpen(open)
		writeStoredBoolean(LIBRARY_NAVIGATION_STORAGE_KEY, open)
	}, [])

	// The pill unmounts once the selection is revealed, so focus moves to its
	// label instead of falling back to the document. Committing any opened
	// branch synchronously makes that label focusable right away.
	const handleRevealSelection = useCallback(() => {
		flushSync(onRevealSelection)
		const label = scrollAreaRef.current?.querySelector<HTMLElement>(
			'[aria-current="page"]',
		)
		label?.focus({ preventScroll: true })
		label?.scrollIntoView({ block: 'nearest' })
	}, [onRevealSelection])

	const showRevealSelectionPill = isOpen && hiddenSelection !== undefined

	return (
		<SidebarCollapsibleItem
			open={isOpen}
			aria-label='Library'
			onOpenChange={handleOpenChange}
			xstyle={[
				styles.container,
				libraryRootIsDropTarget && styles.containerIsDropTarget,
			]}
		>
			<SidebarCollapsibleHeader ref={libraryRootRef}>
				<SidebarCollapsibleTrigger>Library</SidebarCollapsibleTrigger>
				<SidebarCollapsibleActions>
					<Tooltip>
						<TooltipTrigger
							render={
								<SidebarItem
									aria-label='Collapse all'
									disabled={openCollectionIds.size === 0}
									icon={ChevronsDownUp}
									iconOnly
									onClick={onCollapseAll}
								/>
							}
						/>
						<TooltipContent>Collapse all</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<SidebarItem
									aria-label='Add collection'
									icon={Plus}
									iconOnly
									onClick={handleCreateCollection}
								/>
							}
						/>
						<TooltipContent>Add collection</TooltipContent>
					</Tooltip>
				</SidebarCollapsibleActions>
			</SidebarCollapsibleHeader>
			<div {...stylex.props(styles.listArea)}>
				<SidebarCollapsibleContent
					render={<nav aria-label='Library collections' />}
					xstyle={styles.nav}
				>
					<div
						ref={scrollAreaRef}
						{...stylex.props(styles.scrollArea, scrollFade.y)}
					>
						<Tree
							xstyle={
								showRevealSelectionPill &&
								styles.collectionTreeWithPill
							}
						>
							{collections.map(collection => (
								<LibraryCollectionItem
									key={collection._id}
									{...collection}
									openCollectionIds={openCollectionIds}
									onCollectionOpenChange={
										onCollectionOpenChange
									}
								/>
							))}
						</Tree>
					</div>
				</SidebarCollapsibleContent>
				{showRevealSelectionPill ? (
					<RevealSelectionPill
						title={hiddenSelection.title.trim() || 'Untitled'}
						onClick={handleRevealSelection}
					/>
				) : null}
			</div>
		</SidebarCollapsibleItem>
	)
}
