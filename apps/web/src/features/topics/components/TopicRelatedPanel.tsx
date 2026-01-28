import {
	ChevronDown,
	Link,
	Loader2,
	Plus,
	Search,
	SquarePen
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { AddPrerequisiteDialog } from '~/features/sources/components/AddPrerequisiteDialog'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { EntityType } from '~/models/entity-relations.types'
import { useAddTopicEntityRelation } from '../api/addTopicEntityRelation'
import { useRemoveTopicEntityRelation } from '../api/removeTopicEntityRelation'
import type { RelatedEntityItem } from '../types/topic.types'
import { AddRelationshipDialog } from './AddRelationshipDialog'
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
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [showAddTopicDialog, setShowAddTopicDialog] = useState(false)
	const [showAddEntityDialog, setShowAddEntityDialog] = useState(false)
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

	// Handle adding any entity type (from AddPrerequisiteDialog)
	const handleAddEntity = useCallback(
		async (entityType: EntityType, entityId: number) => {
			if (!topicId) return
			await addRelation.mutateAsync({
				topicId,
				data: {
					to_entity_type: entityType,
					to_entity_id: entityId
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
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true} disabled={isCreating}>
							<Button className='gap-1' size='sm' variant='secondary'>
								{isCreating ? (
									<Loader2 className='h-4 w-4 animate-spin' />
								) : (
									<Plus className='h-4 w-4' />
								)}
								Add
								<ChevronDown className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start'>
							<DropdownMenuItem onClick={() => setShowAddTopicDialog(true)}>
								<SquarePen className='h-4 w-4' />
								Create New Topic
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
								<Search className='h-4 w-4' />
								Search Topics
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setShowAddEntityDialog(true)}>
								<Search className='h-4 w-4' />
								Search Sources
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
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

			<AddRelationshipDialog
				isCreating={isCreating}
				onCreateNew={() => {
					setShowCreateDialog(false)
					setShowAddTopicDialog(true)
				}}
				onOpenChange={setShowCreateDialog}
				onSelected={handleAddTopic}
				open={showCreateDialog}
				relationshipType='related'
				topicId={topicId}
			/>

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

			<AddPrerequisiteDialog
				isAdding={isCreating}
				onOpenChange={setShowAddEntityDialog}
				onSelected={handleAddEntity}
				open={showAddEntityDialog}
				topicId={topicId}
			/>
		</div>
	)
}
