import { useDroppable } from '@dnd-kit/react'
import * as stylex from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useCallback } from 'react'

import { Button, Tree } from '~/components/ui'
import { librarySidebarColors } from '~/styles/colors/components.stylex'
import { fontWeights, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { useCreateCollection } from '../../api/collectionQueries'
import type { CollectionWithChildren } from '../../types/collection.types'
import { LibraryCollectionItem } from './LibraryCollectionItem'

const styles = stylex.create({
	container: {
		backgroundColor: librarySidebarColors.background,
		overflowY: 'auto',
		overscrollBehaviorY: 'none',
	},
	stickyWrapper: {
		backgroundColor: librarySidebarColors.background,
		insetBlockStart: 0,
		position: 'sticky',
		zIndex: 1,
	},
	header: {
		padding: spacing.xs,
		marginInline: spacing.xs,
		paddingBlockStart: spacing.md,

		display: 'flex',

		borderRadius: radii.md,
	},
	headerIsDropTarget: {
		backgroundColor: librarySidebarColors.headerBackgroundDropTarget,
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
}

export function LibrarySidebarContent({
	collections,
}: LibrarySidebarContentProps) {
	const createCollection = useCreateCollection()
	const navigate = useNavigate()
	const { ref: droppableHeaderRef, isDropTarget: headerIsDropTarget } =
		useDroppable({
			id: 'library-root',
		})

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
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.stickyWrapper)}>
				<div
					ref={droppableHeaderRef}
					{...stylex.props(
						styles.header,
						headerIsDropTarget && styles.headerIsDropTarget,
					)}
				>
					<p {...stylex.props(styles.headerText)}>Library</p>
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
			<nav aria-label='Library collections' {...stylex.props(styles.nav)}>
				<Tree>
					{collections.map(collection => (
						<LibraryCollectionItem
							key={collection._id}
							{...collection}
						/>
					))}
				</Tree>
			</nav>
		</div>
	)
}
