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
} from '~/components/sidebar'
import { Button, Tree } from '~/components/ui'
import { librarySidebarColors } from '~/styles/colors/components.stylex'
import { appSidebar, iconWeights, spacing } from '~/styles/tokens.stylex'

import { useCreateCollection } from '../../api/collectionQueries'
import type { CollectionWithChildren } from '../../types/collection.types'
import {
	type CollectionOpenChangeHandler,
	LibraryCollectionItem,
} from './LibraryCollectionItem'

const styles = stylex.create({
	container: {
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
		WebkitMaskImage:
			'linear-gradient(to bottom, black 0, black calc(100% - 24px), transparent 100%)',
		paddingBlock: 0,
		paddingInline: 0,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		inlineSize: '100%',
		maskImage:
			'linear-gradient(to bottom, black 0, black calc(100% - 24px), transparent 100%)',
		minHeight: 0,
		overflowY: 'auto',
	},
	navScrolled: {
		WebkitMaskImage:
			'linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)',
		maskImage:
			'linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)',
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
			defaultOpen
			aria-label='Library'
			xstyle={[
				styles.container,
				libraryRootIsDropTarget && styles.containerIsDropTarget,
			]}
		>
			<SidebarCollapsibleHeader ref={libraryRootRef}>
				<SidebarCollapsibleTrigger>Library</SidebarCollapsibleTrigger>
				<SidebarCollapsibleActions>
					<Button.Icon
						aria-label='Collapse all collections'
						disabled={openCollectionIds.size === 0}
						shape='round'
						size='micro'
						variant='ghost'
						onClick={onCollapseAll}
					>
						<ChevronsDownUp
							aria-hidden='true'
							size={appSidebar.iconSize}
							strokeWidth={iconWeights.medium}
						/>
					</Button.Icon>
					<Button.Icon
						aria-label='Add collection'
						shape='round'
						size='micro'
						variant='ghost'
						onClick={handleCreateCollection}
					>
						<Plus
							aria-hidden='true'
							size={appSidebar.iconSize}
							strokeWidth={iconWeights.medium}
						/>
					</Button.Icon>
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
