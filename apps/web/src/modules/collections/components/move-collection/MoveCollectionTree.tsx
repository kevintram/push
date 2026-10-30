import type { Id } from '@convex/_generated/dataModel'

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
	collections: ReadonlyArray<CollectionWithChildren>
	onCollectionOpenChange: (
		collectionId: Id<'collections'>,
		open: boolean,
	) => void
	onSelect: (destination: Id<'collections'> | null) => void
	openCollectionIds: ReadonlySet<Id<'collections'>>
	selectedDestination: Id<'collections'> | null
}

export function MoveCollectionTree({
	allowRoot = false,
	collections,
	onCollectionOpenChange,
	onSelect,
	openCollectionIds,
	selectedDestination,
}: MoveCollectionTreeProps) {
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
			{collections.map(collection => (
				<MoveCollectionItem
					key={collection._id}
					{...collection}
					onSelect={onSelect}
					selectedCollectionId={selectedDestination}
					openCollectionIds={openCollectionIds}
					onCollectionOpenChange={onCollectionOpenChange}
				/>
			))}
		</Tree>
	)
}
