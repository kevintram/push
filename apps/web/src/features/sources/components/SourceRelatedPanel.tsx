import {
	useCallback,
	useEffect,
	useInsertionEffect,
	useMemo,
	useRef,
	useState
} from 'react'
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
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import type { RelatedEntityItem } from '~/features/topics/types/topic.types'
import type { EntityType } from '~/models/entity-relations.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddSourceEntityRelation } from '../api/addSourceEntityRelation'
import { useSourceEntityRelations } from '../api/getSourceEntityRelations'
import { useRemoveSourceEntityRelation } from '../api/removeSourceEntityRelation'
import { SourceActionMenu } from './SourceActionMenu'

interface SourceRelatedPanelProps {
	sourceId: number | undefined
	relatedOutgoing?: Array<RelatedEntityItem>
	relatedIncoming?: Array<RelatedEntityItem>
	onCountChange?: (count: number) => void
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	inheritFsrsState?: FsrsState | null
	onTopicNavigate?: (topicId: number) => void
	onSourceNavigate?: (sourceId: number) => void
}

export function SourceRelatedPanel({
	sourceId,
	relatedOutgoing = [],
	relatedIncoming = [],
	onCountChange,
	getScrollElement,
	scrollMargin,
	inheritFsrsState,
	onTopicNavigate,
	onSourceNavigate
}: SourceRelatedPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
	const [showCreateSourceDialog, setShowCreateSourceDialog] = useState(false)
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const relatedQuery = useSourceEntityRelations(sourceId, {
		enabled: relatedOutgoing.length === 0 && relatedIncoming.length === 0
	})

	const outgoing =
		relatedOutgoing.length > 0
			? relatedOutgoing
			: (relatedQuery.data?.outgoing ?? [])
	const incoming =
		relatedIncoming.length > 0
			? relatedIncoming
			: (relatedQuery.data?.incoming ?? [])
	const isLoading =
		relatedOutgoing.length === 0 &&
		relatedIncoming.length === 0 &&
		relatedQuery.isPending
	const isError =
		relatedOutgoing.length === 0 &&
		relatedIncoming.length === 0 &&
		relatedQuery.isError

	const addRelation = useAddSourceEntityRelation()
	const removeRelation = useRemoveSourceEntityRelation()

	const isAdding = addRelation.isPending

	const allRelated = useMemo(() => {
		const merged = [
			...outgoing.map(r => ({ ...r, direction: 'outgoing' as const })),
			...incoming.map(r => ({ ...r, direction: 'incoming' as const }))
		]
		const seen = new Set<string>()

		return merged.filter(entity => {
			const key = `${entity.entity_type}-${entity.id}`
			if (seen.has(key)) return false
			seen.add(key)
			return true
		})
	}, [outgoing, incoming])
	useEffect(() => {
		onCountChange?.(allRelated.length)
	}, [allRelated.length, onCountChange])

	const entityItems = useMemo<Array<EntityItem>>(() => {
		return allRelated.map((item): EntityItem => {
			if (item.entity_type === 'topic') {
				return { type: 'topic', item }
			}
			return { type: 'source', item }
		})
	}, [allRelated])

	const filteredEntityItems = useMemo(() => {
		if (activeFilter === 'all') return entityItems
		return entityItems.filter(entity => entity.type === activeFilter)
	}, [activeFilter, entityItems])

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
			onTopicNavigate?.(topicId)
		},
		[onTopicNavigate]
	)

	const handleSourceNavigate = useCallback(
		(id: number) => {
			onSourceNavigate?.(id)
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

	const allRelatedRef = useRef(allRelated)
	useInsertionEffect(() => {
		allRelatedRef.current = allRelated
	}, [allRelated])
	const removeRelationRef = useRef(removeRelation)
	useInsertionEffect(() => {
		removeRelationRef.current = removeRelation
	}, [removeRelation])

	const renderItem = useCallback(
		(entity: EntityItem) => {
			const handleRemove = () => {
				const originalItem = allRelatedRef.current.find(
					r => r.entity_type === entity.type && r.id === entity.item.id
				)
				if (!(sourceId && originalItem)) return
				removeRelationRef.current.mutate({
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
		[handleEntityClick, sourceId]
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
							onSelect: () => setShowCreateTopicDialog(true)
						},
						{
							label: 'Source',
							onSelect: () => setShowCreateSourceDialog(true)
						}
					]}
					isLoading={isAdding}
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
					relatedOutgoing.length === 0 &&
					relatedIncoming.length === 0 &&
					relatedQuery.isFetching &&
					!isLoading
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
