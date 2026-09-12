import type { Id } from '@convex/_generated/dataModel'
import { Link } from '@tanstack/react-router'
import { FolderInput, Plus, Trash2 } from 'lucide-react'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	TreeItemLabel,
} from '~/components/ui'
import { iconSizes } from '~/styles/tokens.stylex'

type LibraryCollectionContextMenuProps = {
	collectionId: Id<'collections'>
	collectionTitle: string
	onCreateSubcollection: () => void
	onMove: () => void
	onDelete: () => void
}

export function LibraryCollectionContextMenu({
	collectionId,
	collectionTitle,
	onCreateSubcollection,
	onMove,
	onDelete,
}: LibraryCollectionContextMenuProps) {
	return (
		<ContextMenu>
			<ContextMenuTrigger
				render={
					<TreeItemLabel
						render={
							<Link
								to='/library/$collectionId'
								params={{ collectionId }}
								activeOptions={{ exact: true }}
								aria-label={collectionTitle}
							/>
						}
					/>
				}
			>
				{collectionTitle}
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={onCreateSubcollection}>
					<Plus aria-hidden='true' size={iconSizes.md} />
					Add subcollection
				</ContextMenuItem>
				<ContextMenuItem onClick={onMove}>
					<FolderInput aria-hidden='true' size={iconSizes.md} />
					Move
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem onClick={onDelete}>
					<Trash2 aria-hidden='true' size={iconSizes.md} />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}
