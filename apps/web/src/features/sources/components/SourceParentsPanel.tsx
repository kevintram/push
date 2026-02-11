import { User2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { useSourceWithRelationships } from '~/features/sources/api/getSource'
import { useSetSourceParent } from '~/features/sources/api/setSourceParent'
import { useUpdateSource } from '../api/updateSource'
import type { Source } from '../types/source.types'
import { AddSourceDialog } from './AddSourceDialog'
import { SourceBadge } from './SourceBadge'

interface SourceParentsPanelProps {
	sourceId: number | undefined
	parent?: Source | null
	parentId?: number | null
	onParentSelect?: (sourceId: number) => void
}

export function SourceParentsPanel({
	sourceId,
	parent: parentProp,
	parentId,
	onParentSelect
}: SourceParentsPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	const { source: fetchedParent } = useSourceWithRelationships(
		parentId ?? undefined
	)
	const parent = parentProp !== undefined ? parentProp : fetchedParent
	const hasParent = parent != null

	const updateSource = useUpdateSource()
	const setSourceParent = useSetSourceParent()

	const isUpdating = updateSource.isPending || setSourceParent.isPending

	const handleParentSelect = useCallback(
		(parentId: number) => {
			onParentSelect?.(parentId)
		},
		[onParentSelect]
	)

	const handleRemoveParent = useCallback(() => {
		if (!(sourceId && parent)) return
		updateSource.mutate({
			id: sourceId,
			parent_id: null
		})
	}, [sourceId, parent, updateSource])

	const handleSearchSelected = useCallback(
		(entityType: 'topic' | 'source' | 'practice', entity: { id: number }) => {
			if (entityType !== 'source') return
			if (!sourceId) return
			setSourceParent.mutate({
				sourceId,
				parentId: entity.id
			})
		},
		[sourceId, setSourceParent]
	)

	return (
		<>
			<div className='flex flex-wrap items-center gap-2'>
				<div className='flex items-center gap-2'>
					<User2 className='h-4 w-4' />
					<span className='font-medium text-muted-foreground text-xs'>
						Parent sources ({hasParent ? 1 : 0})
					</span>
				</div>
				{parent ? (
					<SourceBadge
						notes={parent.notes}
						onClick={() => handleParentSelect(parent.id)}
						onRemove={handleRemoveParent}
						title={parent.title}
					/>
				) : null}
				{sourceId && (
					<AddEntityMenu
						createItems={[
							{
								label: 'Create Source',
								onSelect: () => setShowCreateDialog(true)
							}
						]}
						disabled={!sourceId}
						isLoading={isUpdating}
						onSearch={() => setShowSearchDialog(true)}
						searchLabel='Search Sources'
					/>
				)}
			</div>

			{sourceId && (
				<EntitySearchDialog
					defaultType='source'
					entityTypes={['source']}
					existingIds={{
						source: parent ? [parent.id] : []
					}}
					onOpenChange={setShowSearchDialog}
					onSelected={handleSearchSelected}
					open={showSearchDialog}
					sourceSearchParams={{
						addableAsParentTo: sourceId
					}}
					title='Search parent sources'
				/>
			)}

			{sourceId && (
				<AddSourceDialog
					onOpenChange={setShowCreateDialog}
					open={showCreateDialog}
					relationship={{ kind: 'parent', childSourceId: sourceId }}
				/>
			)}
		</>
	)
}
