import type { Id } from '@convex/_generated/dataModel'
import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronsDownUp, Plus } from 'lucide-react'
import { useCallback } from 'react'

import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Tree,
} from '~/components/ui'
import {
	librarySidebarColors,
	sidebarSectionHeaderColors,
} from '~/styles/colors/components.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

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
		overscrollBehaviorY: 'none',
	},
	containerIsDropTarget: {
		backgroundColor: librarySidebarColors.containerBackgroundDropTarget,
	},
	header: {
		gap: spacing.xs,
		paddingBlockStart: spacing.md,

		alignItems: 'center',
		display: 'flex',
		inlineSize: '100%',
		minBlockSize: '36px',
	},
	toggle: {
		borderWidth: 0,
		gap: spacing.xs,
		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,

		borderRadius: radii.lg,
		alignItems: 'center',
		backgroundColor: 'transparent',
		color: sidebarSectionHeaderColors.foreground,
		cursor: 'pointer',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontFamily: 'inherit',
		fontSize: fontSizes.md,
		fontWeight: fontWeights.regular,
		minInlineSize: 0,
		textAlign: 'start',
	},
	chevron: {
		blockSize: iconSizes.sm,
		flexShrink: 0,
		inlineSize: iconSizes.sm,
		opacity: {
			default: 0,
			[stylex.when.ancestor(':focus-within')]: 1,
			[stylex.when.ancestor(':hover')]: 1,
		},
	},
	chevronCollapsed: {
		transform: 'rotate(-90deg)',
	},
	actions: {
		display: 'flex',
		flexShrink: 0,
	},
	nav: {
		padding: spacing.md,
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		inlineSize: '100%',
		minHeight: 0,
		overflowY: 'auto',
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
		<Collapsible
			defaultOpen
			render={<section aria-label='Library' />}
			xstyle={[
				styles.container,
				libraryRootIsDropTarget && styles.containerIsDropTarget,
			]}
		>
			<div
				ref={libraryRootRef}
				{...stylex.props(stylex.defaultMarker(), styles.header)}
			>
				<CollapsibleTrigger
					render={(renderProps, { open }) => (
						<button
							{...renderProps}
							aria-label={`${open ? 'Collapse' : 'Expand'} Library`}
							type='button'
						>
							<span>Library</span>
							<ChevronDown
								aria-hidden='true'
								{...stylex.props(
									styles.chevron,
									!open && styles.chevronCollapsed,
								)}
							/>
						</button>
					)}
					xstyle={styles.toggle}
				/>
				<div {...stylex.props(styles.actions)}>
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
			<CollapsibleContent
				render={<nav aria-label='Library collections' />}
				xstyle={styles.nav}
			>
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
			</CollapsibleContent>
		</Collapsible>
	)
}
