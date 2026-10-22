import type { Id } from '@convex/_generated/dataModel'
import { useMemo } from 'react'

import {
	Tree,
	TreeItem,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '~/components/ui'
import type { CollectionWithChildren } from '~/modules/collections/types/collection.types'

import { MoveCollectionItem } from './MoveCollectionItem'

type MoveCollectionTreeProps = {
	allowRoot?: boolean
	excludeCollectionId?: Id<'collections'>
	onSelect: (destination: Id<'collections'> | null) => void
	selectedDestination: Id<'collections'> | null
	collections: Array<CollectionWithChildren>
}

export function MoveCollectionTree({
	allowRoot = false,
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

	const isRootSelected = selectedDestination === null

	return (
		<Tree>
			{allowRoot ? (
				<TreeItem selected={isRootSelected}>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger aria-label='Toggle Collections' />
						<TreeItemLabel
							aria-pressed={isRootSelected}
							onClick={() => onSelect(null)}
						>
							Collections
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
