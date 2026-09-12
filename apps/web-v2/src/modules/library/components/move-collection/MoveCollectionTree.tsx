import type { Id } from '@convex/_generated/dataModel'
import { useMemo } from 'react'

import {
	Tree,
	TreeItem,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '~/components/ui'
import type { CollectionWithChildren } from '~/modules/library/types/collection.types'

import { MoveCollectionItem } from './MoveCollectionItem'

type MoveCollectionTreeProps = {
	allowLibraryRoot?: boolean
	excludeCollectionId?: Id<'collections'>
	onSelect: (destination: Id<'collections'> | null) => void
	selectedDestination: Id<'collections'> | null
	collections: Array<CollectionWithChildren>
}

export function MoveCollectionTree({
	allowLibraryRoot = false,
	excludeCollectionId,
	onSelect,
	selectedDestination,
	collections,
}: MoveCollectionTreeProps) {
	const filteredCollections = useMemo(
		() =>
			excludeCollectionId
				? excludeSubtree(collections, excludeCollectionId)
				: collections,
		[collections, excludeCollectionId],
	)

	const isLibrarySelected = selectedDestination === null

	return (
		<Tree>
			{allowLibraryRoot ? (
				<TreeItem label='Library' selected={isLibrarySelected}>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger />
						<TreeItemLabel
							aria-pressed={isLibrarySelected}
							onClick={() => onSelect(null)}
						>
							Library
						</TreeItemLabel>
					</TreeItemContent>
				</TreeItem>
			) : null}
			{filteredCollections.map(collection => (
				<MoveCollectionItem
					key={collection._id}
					{...collection}
					onSelect={onSelect}
					selectedCollectionId={selectedDestination}
				/>
			))}
		</Tree>
	)
}

function excludeSubtree(
	collections: Array<CollectionWithChildren>,
	excludeId: Id<'collections'>,
): Array<CollectionWithChildren> {
	return collections
		.filter(collection => collection._id !== excludeId)
		.map(collection => ({
			...collection,
			childCollections: excludeSubtree(
				collection.childCollections,
				excludeId,
			),
		}))
}
