import type { Id } from '@convex/_generated/dataModel'
import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { ChevronsDownUp, Plus } from 'lucide-react'
import { type UIEvent, useCallback, useState } from 'react'

import {
	SidebarCollapsibleActions,
	SidebarCollapsibleContent,
	SidebarCollapsibleHeader,
	SidebarCollapsibleItem,
	SidebarCollapsibleTrigger,
	SidebarIconButton,
} from '~/components/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger, Tree } from '~/components/ui'
import { librarySidebarColors } from '~/styles/colors/components.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'
import { readStoredBoolean, writeStoredBoolean } from '~/utils/storage'

import { useCreateCollection } from '../../api/collectionQueries'
import type { CollectionWithChildren } from '../../types/collection.types'
import {
	type CollectionOpenChangeHandler,
	LibraryCollectionItem,
} from './LibraryCollectionItem'

const LIBRARY_NAVIGATION_STORAGE_KEY = 'libraryNavigationOpen'
// Height of the fades at the scroll edges of the collection list.
const EDGE_FADE_SIZE = '24px'

const styles = stylex.create({
	container: {
		borderRadius: radii.lg,
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100%',
		height: '100%',
		minHeight: 0,
	},
	containerIsDropTarget: {
		backgroundColor: librarySidebarColors.containerBackgroundDropTarget,
	},
	nav: {
		WebkitMaskImage: `linear-gradient(to bottom, black 0, black calc(100% - ${EDGE_FADE_SIZE}), transparent 100%)`,
		paddingBlock: 0,
		paddingInline: 0,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		inlineSize: '100%',
		maskImage: `linear-gradient(to bottom, black 0, black calc(100% - ${EDGE_FADE_SIZE}), transparent 100%)`,
		// Keeps focused and revealed rows clear of the edge fades.
		scrollPaddingBlockEnd: EDGE_FADE_SIZE,
		scrollPaddingBlockStart: EDGE_FADE_SIZE,
		minHeight: 0,
		overflowY: 'auto',
	},
	navScrolled: {
		WebkitMaskImage: `linear-gradient(to bottom, transparent 0, black ${EDGE_FADE_SIZE}, black calc(100% - ${EDGE_FADE_SIZE}), transparent 100%)`,
		maskImage: `linear-gradient(to bottom, transparent 0, black ${EDGE_FADE_SIZE}, black calc(100% - ${EDGE_FADE_SIZE}), transparent 100%)`,
	},
	collectionTree: {
		paddingBlockEnd: spacing.xl,
	},
})

type LibraryNavigationContentProps = {
	collections: ReadonlyArray<CollectionWithChildren>
	openCollectionIds: ReadonlySet<Id<'collections'>>
	onCollectionOpenChange: CollectionOpenChangeHandler
	onCollapseAll: () => void
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
}: LibraryNavigationContentProps) {
	const createCollection = useCreateCollection()
	const navigate = useNavigate()
	const [hasScrolled, setHasScrolled] = useState(false)
	// TODO(4): Investigate simplifying the two mask variants and scroll state while
	// keeping no initial header gap, a full-size top fade after scrolling, and
	// clearance at the bottom edge.

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

	const handleScroll = useCallback((event: UIEvent<HTMLElement>) => {
		setHasScrolled(event.currentTarget.scrollTop > 0)
	}, [])

	return (
		<SidebarCollapsibleItem
			defaultOpen={readStoredBoolean(
				LIBRARY_NAVIGATION_STORAGE_KEY,
				true,
			)}
			aria-label='Library'
			onOpenChange={open =>
				writeStoredBoolean(LIBRARY_NAVIGATION_STORAGE_KEY, open)
			}
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
								<SidebarIconButton
									aria-label='Collapse all'
									disabled={openCollectionIds.size === 0}
									icon={ChevronsDownUp}
									onClick={onCollapseAll}
								/>
							}
						/>
						<TooltipContent>Collapse all</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger
							render={
								<SidebarIconButton
									aria-label='Add collection'
									icon={Plus}
									onClick={handleCreateCollection}
								/>
							}
						/>
						<TooltipContent>Add collection</TooltipContent>
					</Tooltip>
				</SidebarCollapsibleActions>
			</SidebarCollapsibleHeader>
			<SidebarCollapsibleContent
				render={<nav aria-label='Library collections' />}
				xstyle={[styles.nav, hasScrolled && styles.navScrolled]}
				onScroll={handleScroll}
			>
				<Tree xstyle={styles.collectionTree}>
					{collections.map(collection => (
						<LibraryCollectionItem
							key={collection._id}
							{...collection}
							openCollectionIds={openCollectionIds}
							onCollectionOpenChange={onCollectionOpenChange}
						/>
					))}
				</Tree>
			</SidebarCollapsibleContent>
		</SidebarCollapsibleItem>
	)
}
