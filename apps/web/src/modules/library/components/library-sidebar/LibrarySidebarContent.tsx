import type { Id } from '@convex/_generated/dataModel'
import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { ChevronsDownUp, Plus } from 'lucide-react'
import { useCallback } from 'react'

import { Button, Tree } from '~/components/ui'
import { librarySidebarColors } from '~/styles/colors/components.stylex'
import { fontWeights, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { useCreateCollection } from '../../api/collectionQueries'
import type { CollectionWithChildren } from '../../types/collection.types'
import {
	type CollectionOpenChangeHandler,
	LibraryCollectionItem,
} from './LibraryCollectionItem'

const styles = stylex.create({
	container: {
		borderRadius: radii['2xl'],
		backgroundColor: librarySidebarColors.background,
		overflowY: 'auto',
		overscrollBehaviorY: 'none',
	},
	containerIsDropTarget: {
		backgroundColor: librarySidebarColors.containerBackgroundDropTarget,
	},
	stickyWrapper: {
		backgroundColor: librarySidebarColors.background,
		insetBlockStart: 0,
		position: 'sticky',
		zIndex: 1,
	},
	stickyWrapperIsDropTarget: {
		backgroundColor: 'transparent',
	},
	header: {
		padding: spacing.xs,
		marginInline: spacing.xs,
		paddingBlockStart: spacing.md,

		display: 'flex',
	},
	headerText: {
		paddingInline: spacing.sm,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontWeight: fontWeights.semibold,
	},
	nav: {
		padding: spacing.md,
		flexShrink: 0,
		inlineSize: '240px',
		height: '100%',
	},
})

type LibrarySidebarContentProps = {
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
export function LibrarySidebarContent({
	collections,
	openCollectionIds,
	onCollectionOpenChange,
	onCollapseAll,
}: LibrarySidebarContentProps) {
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
		<div
			{...stylex.props(
				styles.container,
				libraryRootIsDropTarget && styles.containerIsDropTarget,
			)}
		>
			<div
				{...stylex.props(
					styles.stickyWrapper,
					libraryRootIsDropTarget && styles.stickyWrapperIsDropTarget,
				)}
			>
				<div ref={libraryRootRef} {...stylex.props(styles.header)}>
					<p {...stylex.props(styles.headerText)}>Library</p>
					<div>
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
								size={iconSizes.md}
							/>
						</Button.Icon>
						<Button.Icon
							aria-label='Add collection'
							shape='round'
							size='micro'
							variant='ghost'
							onClick={handleCreateCollection}
						>
							<Plus aria-hidden='true' size={iconSizes.md} />
						</Button.Icon>
					</div>
				</div>
			</div>
			<nav aria-label='Library collections' {...stylex.props(styles.nav)}>
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
			</nav>
		</div>
	)
}
