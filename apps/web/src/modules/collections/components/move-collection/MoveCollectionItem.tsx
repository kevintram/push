import type { Id } from '@convex/_generated/dataModel'

import {
	TreeItem,
	TreeItemChildren,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '~/components/ui'
import type { CollectionWithChildren } from '~/modules/collections/types/collection.types'

type MoveCollectionItemProps = CollectionWithChildren & {
	onSelect: (collectionId: Id<'collections'>) => void
	selectedCollectionId: Id<'collections'> | null
	openCollectionIds: ReadonlySet<Id<'collections'>>
	onCollectionOpenChange: (
		collectionId: Id<'collections'>,
		open: boolean,
	) => void
}

export function MoveCollectionItem({
	_id,
	title,
	childCollections,
	onSelect,
	selectedCollectionId,
	openCollectionIds,
	onCollectionOpenChange,
}: MoveCollectionItemProps) {
	const collectionTitle = title.trim() || 'Untitled'
	const hasChildren = childCollections.length > 0
	const isSelected = selectedCollectionId === _id

	return (
		<TreeItem
			collapsible={hasChildren}
			open={openCollectionIds.has(_id)}
			onOpenChange={open => onCollectionOpenChange(_id, open)}
			selected={isSelected}
		>
			<TreeItemContent>
				<TreeItemCollapsibleTrigger
					aria-label={`Toggle ${collectionTitle}`}
				/>
				<TreeItemLabel
					aria-pressed={isSelected}
					onClick={() => onSelect(_id)}
				>
					{collectionTitle}
				</TreeItemLabel>
			</TreeItemContent>

			<TreeItemChildren>
				{childCollections.map(child => (
					<MoveCollectionItem
						key={child._id}
						{...child}
						onSelect={onSelect}
						selectedCollectionId={selectedCollectionId}
						openCollectionIds={openCollectionIds}
						onCollectionOpenChange={onCollectionOpenChange}
					/>
				))}
			</TreeItemChildren>
		</TreeItem>
	)
}
