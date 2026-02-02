import { ChevronDown, Link } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/AddEntityMenu'
import { Button } from '~/components/ui/Button'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import type { RelatedEntityItem } from '~/features/topics/types/topic.types'
import type { EntityType } from '~/models/entity-relations.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddSourceEntityRelation } from '../api/addSourceEntityRelation'
import { useRemoveSourceEntityRelation } from '../api/removeSourceEntityRelation'
import { SourceActionMenu } from './SourceActionMenu'

interface SourceRelatedPanelProps {
	sourceId: number | undefined
	relatedOutgoing?: Array<RelatedEntityItem>
	relatedIncoming?: Array<RelatedEntityItem>
	inheritFsrsState?: FsrsState | null
	onTopicNavigate?: (topicId: number) => void
	onSourceNavigate?: (sourceId: number) => void
}

export function SourceRelatedPanel({
	sourceId,
	relatedOutgoing = [],
	relatedIncoming = [],
	inheritFsrsState,
	onTopicNavigate,
	onSourceNavigate
}: SourceRelatedPanelProps) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
	const [showCreateSourceDialog, setShowCreateSourceDialog] = useState(false)

	const addRelation = useAddSourceEntityRelation()
	const removeRelation = useRemoveSourceEntityRelation()

	const isAdding = addRelation.isPending

	// Merge outgoing and incoming for display
	const allRelated = useMemo(
		() => [
			...relatedOutgoing.map(r => ({ ...r, direction: 'outgoing' as const })),
			...relatedIncoming.map(r => ({ ...r, direction: 'incoming' as const }))
		],
		[relatedOutgoing, relatedIncoming]
	)

	// Convert to EntityItem format for EntityCard/MasonryLayout
	const entityItems = useMemo<Array<EntityItem>>(() => {
		return allRelated.map((item): EntityItem => {
			if (item.entity_type === 'topic') {
				return { type: 'topic', item }
			}
			return { type: 'source', item }
		})
	}, [allRelated])

	const handleAdd = useCallback(
		(entityType: EntityType, entityId: number) => {
			if (!sourceId) return
			addRelation.mutate({
				sourceId,
				data: {
					to_entity_type: entityType,
					to_entity_id: entityId
				}
			})
		},
		[sourceId, addRelation]
	)

	const handleTopicNavigate = useCallback(
		(topicId: number) => {
			if (onTopicNavigate) {
				onTopicNavigate(topicId)
			}
		},
		[onTopicNavigate]
	)

	const handleSourceNavigate = useCallback(
		(id: number) => {
			if (onSourceNavigate) {
				onSourceNavigate(id)
			}
		},
		[onSourceNavigate]
	)

	const handleEntityClick = useCallback(
		(entity: EntityItem) => {
			if (entity.type === 'topic') {
				handleTopicNavigate(entity.item.id)
			} else if (entity.type === 'source') {
				handleSourceNavigate(entity.item.id)
			}
		},
		[handleTopicNavigate, handleSourceNavigate]
	)

	const renderItem = useCallback(
		(entity: EntityItem) => {
			// Get the original related item for remove action
			const originalItem = allRelated.find(
				r => r.entity_type === entity.type && r.id === entity.item.id
			)

			const handleRemove = () => {
				if (!(sourceId && originalItem)) return
				removeRelation.mutate({
					sourceId,
					entityType: originalItem.entity_type as EntityType,
					entityId: originalItem.id
				})
			}

			let headerRight: React.ReactNode
			if (entity.type === 'topic') {
				headerRight = (
					<TopicActionMenu
						onRemoveRelationship={handleRemove}
						removeRelationshipText='Remove Relationship'
						topic={entity.item}
					/>
				)
			} else if (entity.type === 'source') {
				headerRight = (
					<SourceActionMenu
						onRemoveRelationship={handleRemove}
						removeRelationshipText='Remove Relationship'
						source={entity.item}
					/>
				)
			}

			return (
				<EntityCard
					entity={entity}
					headerRight={headerRight}
					minHeight={96}
					onEntityClick={handleEntityClick}
				/>
			)
		},
		[handleEntityClick, sourceId, allRelated, removeRelation]
	)

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				actions={
					<AddEntityMenu
						createItems={[
							{
								label: 'Create Topic',
								onSelect: () => setShowCreateTopicDialog(true)
							},
							{
								label: 'Create Source',
								onSelect: () => setShowCreateSourceDialog(true)
							}
						]}
						isLoading={isAdding}
						onSearch={() => setShowSearchDialog(true)}
						searchLabel='Search'
					/>
				}
				label={
					<Button
						className='flex items-center gap-2 p-0'
						onClick={() => setIsCollapsed(!isCollapsed)}
						variant='ghost'
					>
						<Link className='h-4 w-4' />
						<span className='font-medium text-md text-muted-foreground'>
							Related ({allRelated.length})
						</span>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
						/>
					</Button>
				}
			/>
			{!isCollapsed && (
				<div className='py-4'>
					{entityItems.length === 0 ? (
						<p className='py-2 text-muted-foreground text-sm'>
							No related items
						</p>
					) : (
						<MasonryLayout
							estimateItemSize={estimateEntitySize}
							gap={16}
							getItemKey={getEntityKey}
							items={entityItems}
							minItemWidth={280}
							renderItem={renderItem}
						/>
					)}
				</div>
			)}

			{sourceId && (
				<EntitySearchDialog
					entityTypes={['topic', 'source']}
					onOpenChange={setShowSearchDialog}
					onSelected={(entityType, entity) => {
						if (entityType === 'topic' || entityType === 'source') {
							handleAdd(entityType, entity.id)
						}
					}}
					open={showSearchDialog}
					title='Search related entities'
				/>
			)}

			{sourceId && (
				<AddTopicDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateTopicDialog}
					open={showCreateTopicDialog}
					relationship={{ kind: 'sourceRelated', sourceId }}
				/>
			)}

			{sourceId && (
				<AddSourceDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateSourceDialog}
					open={showCreateSourceDialog}
					relationship={{ kind: 'sourceRelated', sourceId }}
				/>
			)}
		</div>
	)
}
