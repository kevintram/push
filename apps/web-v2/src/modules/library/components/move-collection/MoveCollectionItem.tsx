import type { Id } from '@convex/_generated/dataModel'

import {
	TreeItem,
	TreeItemChildren,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '~/components/ui'
import type { CollectionWithChildren } from '~/modules/library/types/collection.types'

type MoveCollectionItemProps = CollectionWithChildren & {
	onSelect: (collectionId: Id<'collections'>) => void
	selectedCollectionId: Id<'collections'> | null
}

export function MoveCollectionItem({
	_id,
	title,
	childCollections,
	onSelect,
	selectedCollectionId,
}: MoveCollectionItemProps) {
	const collectionTitle = title.trim() || 'Untitled'
	const hasChildren = childCollections.length > 0
	const isSelected = selectedCollectionId === _id

	return (
		<TreeItem collapsible={hasChildren} selected={isSelected}>
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
					/>
				))}
			</TreeItemChildren>
		</TreeItem>
	)
}
