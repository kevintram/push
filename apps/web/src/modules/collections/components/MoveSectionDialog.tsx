import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'

import { useMoveSectionToCollection } from '~/modules/collections/api/sectionQueries'

import { MoveCollectionDialogBase } from './move-collection'

type MoveSectionDialogProps = {
	onOpenChange: (open: boolean) => void
	section: Section
}

export function MoveSectionDialog({
	onOpenChange,
	section,
}: MoveSectionDialogProps) {
	const moveSection = useMoveSectionToCollection()

	const handleMove = (destination: Id<'collections'>) => {
		moveSection.mutate(
			{ sectionId: section._id, collectionId: destination },
			{ onSuccess: () => onOpenChange(false) },
		)
	}

	return (
		<MoveCollectionDialogBase
			initialDestination={section.collectionId}
			isPending={moveSection.isPending}
			onMove={handleMove}
			onOpenChange={onOpenChange}
			title='Move section'
		/>
	)
}
