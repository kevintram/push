import type { Id } from '@convex/_generated/dataModel'
import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { ChevronsDownUp, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
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
import { librarySidebarColors } from '~/styles/colors/components.stylex'
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
import {
	type HiddenSelectionPosition,
	RevealSelectionPill,
} from './RevealSelectionPill'
import { useOffscreenDirection } from './useOffscreenDirection'

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
		backgroundColor: librarySidebarColors.containerBackgroundDropTarget,
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
	selectedCollection?: CollectionWithChildren
	/** Whether a collapsed ancestor hides the selected collection in the tree. */
	isSelectionCollapsed?: boolean
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
	selectedCollection,
	isSelectionCollapsed = false,
	onRevealSelection,
}: LibraryNavigationContentProps) {
	const createCollection = useCreateCollection()
	const navigate = useNavigate()
	// Elements in state so the offscreen check reattaches when either remounts.
	const [scrollArea, setScrollArea] = useState<HTMLElement | null>(null)
	const [selectedLabel, setSelectedLabel] = useState<HTMLElement | null>(null)
	const offscreenDirection = useOffscreenDirection(scrollArea, selectedLabel)
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

	// The pill unmounts once the selection is in view, so focus moves to its
	// label instead of falling back to the document. Committing any opened
	// branch synchronously makes that label focusable right away.
	const handleRevealSelection = useCallback(() => {
		flushSync(onRevealSelection)
		selectedLabel?.focus({ preventScroll: true })
		selectedLabel?.scrollIntoView({ block: 'nearest' })
	}, [onRevealSelection, selectedLabel])

	const hiddenSelectionPosition: HiddenSelectionPosition | undefined =
		isSelectionCollapsed ? 'collapsed' : offscreenDirection
	const showRevealSelectionPill =
		isOpen &&
		selectedCollection !== undefined &&
		hiddenSelectionPosition !== undefined

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
						ref={setScrollArea}
						{...stylex.props(styles.scrollArea, scrollFade.y)}
					>
						<Tree
							xstyle={
								// A scrolled-out selection comes into view, and its
								// pill goes away, before the list reaches its end.
								showRevealSelectionPill &&
								hiddenSelectionPosition === 'collapsed' &&
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
									selectedLabelRef={setSelectedLabel}
								/>
							))}
						</Tree>
					</div>
				</SidebarCollapsibleContent>
				{showRevealSelectionPill ? (
					<RevealSelectionPill
						// Remount on a change so the pill enters again, from its new
						// edge if it moved.
						key={hiddenSelectionPosition}
						title={selectedCollection.title.trim() || 'Untitled'}
						position={hiddenSelectionPosition}
						onClick={handleRevealSelection}
					/>
				) : null}
			</div>
		</SidebarCollapsibleItem>
	)
}
