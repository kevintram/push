import type { Id } from '@convex/_generated/dataModel'
import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { ChevronsDownUp, Plus } from 'lucide-react'
import { useCallback } from 'react'

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
import { scrollFade } from '~/styles/scrollFade'
import { radii } from '~/styles/tokens.stylex'
import { readStoredBoolean, writeStoredBoolean } from '~/utils/storage'

import { useCreateCollection } from '../../api/collectionQueries'
import type { CollectionWithChildren } from '../../types/collection.types'
import {
	type CollectionOpenChangeHandler,
	LibraryCollectionItem,
} from './LibraryCollectionItem'

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
		minHeight: 0,
		overflowY: 'auto',
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
				xstyle={styles.nav}
			>
				<div {...stylex.props(styles.scrollArea, scrollFade.y)}>
					<Tree>
						{collections.map(collection => (
							<LibraryCollectionItem
								key={collection._id}
								{...collection}
								openCollectionIds={openCollectionIds}
								onCollectionOpenChange={onCollectionOpenChange}
							/>
						))}
					</Tree>
				</div>
			</SidebarCollapsibleContent>
		</SidebarCollapsibleItem>
	)
}
