import { ChevronDown, Link } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { EntityType } from '~/models/entity-relations.types'
import { useAddTopicEntityRelation } from '../api/addTopicEntityRelation'
import { useRemoveTopicEntityRelation } from '../api/removeTopicEntityRelation'
import type { RelatedEntityItem } from '../types/topic.types'
import { AddTopicDialog, type SrsSource } from './AddTopicDialog'
import { TopicActionMenu } from './TopicActionMenu'

interface TopicRelatedPanelProps {
	topicId: number | undefined
	/**
	 * Related entities from the single getTopic fetch (merged incoming + outgoing with direction).
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	related?: Array<RelatedEntityItem>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Source topic's SRS fields for the "inherit SRS" option.
	 */
	srsSource?: SrsSource | null
	/**
	 * Called when a related topic is selected/clicked.
	 * If not provided, defaults to opening the topic dialog.
	 */
	onRelatedSelect?: (topicId: number) => void
	/**
	 * Called when a related source is selected/clicked.
	 * If not provided, defaults to opening the source dialog.
	 */
	onSourceSelect?: (sourceId: number) => void
}

export function TopicRelatedPanel({
	topicId,
	related: relatedProp,
	srsSource,
	onRelatedSelect,
	onSourceSelect
}: TopicRelatedPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showAddTopicDialog, setShowAddTopicDialog] = useState(false)
	const [showAddSourceDialog, setShowAddSourceDialog] = useState(false)
	const [isCollapsed, setIsCollapsed] = useState(false)
	const { openTopicDialog } = useReviewTopicDialog()

	// Use prop directly - related comes from the single getTopic fetch (merged incoming + outgoing)
	const related = relatedProp ?? []

	const addRelation = useAddTopicEntityRelation()
	const removeRelation = useRemoveTopicEntityRelation()

	const isCreating = addRelation.isPending

	// Convert RelatedEntityItem to EntityItem for EntityCard/MasonryLayout
	const entityItems = useMemo<Array<EntityItem>>(() => {
		return related.map((item): EntityItem => {
			if (item.entity_type === 'topic') {
				return { type: 'topic', item }
			}
			return { type: 'source', item }
		})
	}, [related])

	// Handle navigation for topics
	const handleRelatedSelect = useCallback(
		(relatedTopicId: number) => {
			if (onRelatedSelect) {
				onRelatedSelect(relatedTopicId)
			} else {
				openTopicDialog(relatedTopicId)
			}
		},
		[onRelatedSelect, openTopicDialog]
	)

	// Handle navigation for sources
	const handleSourceSelect = useCallback(
		(sourceId: number) => {
			if (onSourceSelect) {
				onSourceSelect(sourceId)
			}
		},
		[onSourceSelect]
	)

	// Handle adding a topic relation (from AddRelationshipDialog which only searches topics)
	const handleAddTopic = useCallback(
		async (topic: { id: number }) => {
			if (!topicId) return
			await addRelation.mutateAsync({
				topicId,
				data: {
					to_entity_type: EntityType.Topic,
					to_entity_id: topic.id
				}
			})
		},
		[topicId, addRelation]
	)

	const handleAddSource = useCallback(
		async (source: { id: number }) => {
			if (!topicId) return
			await addRelation.mutateAsync({
				topicId,
				data: {
					to_entity_type: EntityType.Source,
					to_entity_id: source.id
				}
			})
		},
		[topicId, addRelation]
	)

	const handleEntityClick = useCallback(
		(entity: EntityItem) => {
			if (entity.type === 'topic') {
				handleRelatedSelect(entity.item.id)
			} else if (entity.type === 'source') {
				handleSourceSelect(entity.item.id)
			}
		},
		[handleRelatedSelect, handleSourceSelect]
	)

	const existingTopicIds = useMemo(
		() => related.filter(r => r.entity_type === 'topic').map(r => r.id),
		[related]
	)

	const existingSourceIds = useMemo(
		() => related.filter(r => r.entity_type === 'source').map(r => r.id),
		[related]
	)

	const renderItem = useCallback(
		(entity: EntityItem) => {
			// Get the original related item for remove action
			const originalItem = related.find(
				r => r.entity_type === entity.type && r.id === entity.item.id
			)

			const handleRemove = () => {
				if (!(topicId && originalItem)) return
				removeRelation.mutate({
					topicId,
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
		[handleEntityClick, topicId, related, removeRelation]
	)

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				actions={
					<AddEntityMenu
						createItems={[
							{
								label: 'Create Topic',
								onSelect: () => setShowAddTopicDialog(true)
							},
							{
								label: 'Create Source',
								onSelect: () => setShowAddSourceDialog(true)
							}
						]}
						isLoading={isCreating}
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
							Related ({related.length})
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

			{topicId && (
				<EntitySearchDialog
					entityTypes={['topic', 'source']}
					existingIds={{
						topic: existingTopicIds,
						source: existingSourceIds
					}}
					onOpenChange={setShowSearchDialog}
					onSelected={(entityType, entity) => {
						if (entityType === 'topic') {
							handleAddTopic(entity as { id: number })
						} else {
							handleAddSource(entity as { id: number })
						}
					}}
					open={showSearchDialog}
					title='Search related entities'
					topicSearchParams={{
						addableAsRelatedTo: topicId
					}}
				/>
			)}

			{topicId && (
				<AddTopicDialog
					context={{
						type: 'related',
						fromTopicId: topicId,
						srsSource
					}}
					onOpenChange={setShowAddTopicDialog}
					onSuccess={newTopicId => {
						toast('Topic created', {
							action: {
								label: 'Open',
								onClick: () => handleRelatedSelect(newTopicId)
							}
						})
					}}
					open={showAddTopicDialog}
				/>
			)}

			{topicId && (
				<AddSourceDialog
					context={{ type: 'topicRelated', topicId }}
					onOpenChange={setShowAddSourceDialog}
					open={showAddSourceDialog}
				/>
			)}
		</div>
	)
}
