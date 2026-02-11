import {
	useCallback,
	useEffect,
	useInsertionEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import { toast } from 'sonner'
import { DetailTabPanelState } from '~/components/DetailTabs'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { EntityType } from '~/models/entity-relations.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddTopicEntityRelation } from '../api/addTopicEntityRelation'
import { useTopicEntityRelations } from '../api/getTopicEntityRelations'
import { useRemoveTopicEntityRelation } from '../api/removeTopicEntityRelation'
import type { RelatedEntityItem } from '../types/topic.types'
import { AddTopicDialog } from './AddTopicDialog'
import { TopicActionMenu } from './TopicActionMenu'

interface TopicRelatedPanelProps {
	topicId: number | undefined
	/**
	 * Related entities from the single getTopic fetch (merged incoming + outgoing with direction).
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	related?: Array<RelatedEntityItem>
	onCountChange?: (count: number) => void
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Source topic's SRS fields for the "inherit SRS" option.
	 */
	inheritFsrsState?: FsrsState | null
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
	onCountChange,
	inheritFsrsState,
	getScrollElement,
	scrollMargin,
	onRelatedSelect,
	onSourceSelect
}: TopicRelatedPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showAddTopicDialog, setShowAddTopicDialog] = useState(false)
	const [showAddSourceDialog, setShowAddSourceDialog] = useState(false)
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const relatedQuery = useTopicEntityRelations(topicId, {
		enabled: relatedProp === undefined
	})

	const related = useMemo(() => {
		if (relatedProp) return relatedProp
		const fromQuery = [
			...(relatedQuery.data?.outgoing ?? []),
			...(relatedQuery.data?.incoming ?? [])
		]
		const seen = new Set<string>()
		return fromQuery.filter(entity => {
			const key = `${entity.entity_type}-${entity.id}`
			if (seen.has(key)) return false
			seen.add(key)
			return true
		})
	}, [relatedProp, relatedQuery.data])
	useEffect(() => {
		onCountChange?.(related.length)
	}, [related.length, onCountChange])
	const isLoading = relatedProp === undefined && relatedQuery.isPending
	const isError = relatedProp === undefined && relatedQuery.isError

	const addRelation = useAddTopicEntityRelation()
	const removeRelation = useRemoveTopicEntityRelation()

	const isCreating = addRelation.isPending

	const entityItems = useMemo<Array<EntityItem>>(() => {
		return related.map((item): EntityItem => {
			if (item.entity_type === 'topic') {
				return { type: 'topic', item }
			}
			return { type: 'source', item }
		})
	}, [related])

	const filteredEntityItems = useMemo(() => {
		if (activeFilter === 'all') return entityItems
		return entityItems.filter(entity => entity.type === activeFilter)
	}, [activeFilter, entityItems])

	const handleRelatedSelect = useCallback(
		(relatedTopicId: number) => {
			onRelatedSelect?.(relatedTopicId)
		},
		[onRelatedSelect]
	)

	const handleSourceSelect = useCallback(
		(sourceId: number) => {
			onSourceSelect?.(sourceId)
		},
		[onSourceSelect]
	)

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

	const relatedRef = useRef(related)
	useInsertionEffect(() => {
		relatedRef.current = related
	}, [related])
	const removeRelationRef = useRef(removeRelation)
	useInsertionEffect(() => {
		removeRelationRef.current = removeRelation
	}, [removeRelation])

	const renderItem = useCallback(
		(entity: EntityItem) => {
			const handleRemove = () => {
				const originalItem = relatedRef.current.find(
					r => r.entity_type === entity.type && r.id === entity.item.id
				)
				if (!(topicId && originalItem)) return
				removeRelationRef.current.mutate({
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
		[handleEntityClick, topicId]
	)

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex items-center justify-between gap-2'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					allowedTypes={['topic', 'source']}
					onFilterChange={setActiveFilter}
				/>
				<AddEntityMenu
					createItems={[
						{
							label: 'Topic',
							onSelect: () => setShowAddTopicDialog(true)
						},
						{
							label: 'Source',
							onSelect: () => setShowAddSourceDialog(true)
						}
					]}
					isLoading={isCreating}
					onSearch={() => setShowSearchDialog(true)}
					searchLabel='Search'
				/>
			</div>

			<DetailTabPanelState
				emptyMessage='No related items'
				error={relatedQuery.error}
				isEmpty={filteredEntityItems.length === 0}
				isError={isError}
				isLoading={isLoading}
				isRefreshing={
					relatedProp === undefined && relatedQuery.isFetching && !isLoading
				}
				onRetry={() => {
					void relatedQuery.refetch()
				}}
			>
				<MasonryLayout
					estimateItemSize={estimateEntitySize}
					gap={16}
					getItemKey={getEntityKey}
					getScrollElement={getScrollElement}
					items={filteredEntityItems}
					minItemWidth={280}
					renderItem={renderItem}
					scrollMargin={scrollMargin}
				/>
			</DetailTabPanelState>

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
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
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
					relationship={{
						kind: 'related',
						fromTopicId: topicId
					}}
				/>
			)}

			{topicId && (
				<AddSourceDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowAddSourceDialog}
					open={showAddSourceDialog}
					relationship={{ kind: 'topicRelated', topicId }}
				/>
			)}
		</div>
	)
}
