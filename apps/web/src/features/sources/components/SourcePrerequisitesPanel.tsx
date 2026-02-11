import {
	useCallback,
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
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import type { EntityType } from '~/models/entity-relations.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddSourcePrerequisite } from '../api/addSourcePrerequisite'
import { useSourcePrerequisites } from '../api/getSourcePrerequisites'
import { useRemoveSourcePrerequisite } from '../api/removeSourcePrerequisite'
import { SourceActionMenu } from './SourceActionMenu'

interface SourcePrerequisitesPanelProps {
	sourceId: number | undefined
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	inheritFsrsState?: FsrsState | null
	onTopicNavigate?: (topicId: number) => void
	onSourceNavigate?: (sourceId: number) => void
}

export function SourcePrerequisitesPanel({
	sourceId,
	getScrollElement,
	scrollMargin,
	inheritFsrsState,
	onTopicNavigate,
	onSourceNavigate
}: SourcePrerequisitesPanelProps) {
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
	const [showCreateSourceDialog, setShowCreateSourceDialog] = useState(false)

	const {
		data: prerequisites = [],
		isLoading,
		isError,
		error,
		isFetching,
		refetch
	} = useSourcePrerequisites(sourceId)
	const addPrerequisite = useAddSourcePrerequisite()
	const removePrerequisite = useRemoveSourcePrerequisite()

	const isAdding = addPrerequisite.isPending

	const handleAddPrerequisite = useCallback(
		(entityType: EntityType, entityId: number) => {
			if (!sourceId) return
			addPrerequisite.mutate({
				sourceId,
				data: {
					prereq_entity_type: entityType,
					prereq_entity_id: entityId
				}
			})
		},
		[sourceId, addPrerequisite]
	)

	const entityItems = useMemo<Array<EntityItem>>(() => {
		return prerequisites.map((item): EntityItem => {
			if (item.entity_type === 'topic') {
				return { type: 'topic', item }
			}
			return { type: 'source', item }
		})
	}, [prerequisites])

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

	const prerequisitesRef = useRef(prerequisites)
	useInsertionEffect(() => {
		prerequisitesRef.current = prerequisites
	}, [prerequisites])
	const removePrerequisiteRef = useRef(removePrerequisite)
	useInsertionEffect(() => {
		removePrerequisiteRef.current = removePrerequisite
	}, [removePrerequisite])

	const renderItem = useCallback(
		(entity: EntityItem) => {
			const handleRemove = () => {
				const originalItem = prerequisitesRef.current.find(
					r => r.entity_type === entity.type && r.id === entity.item.id
				)
				if (!(sourceId && originalItem)) return
				removePrerequisiteRef.current.mutate({
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
						removeRelationshipText='Remove Prerequisite'
						topic={entity.item}
					/>
				)
			} else if (entity.type === 'source') {
				headerRight = (
					<SourceActionMenu
						onRemoveRelationship={handleRemove}
						removeRelationshipText='Remove Prerequisite'
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
			<div className='flex justify-end'>
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
			</div>

			<DetailTabPanelState
				emptyMessage='No prerequisites defined'
				error={error}
				isEmpty={entityItems.length === 0}
				isError={isError}
				isLoading={isLoading}
				isRefreshing={isFetching && !isLoading}
				onRetry={() => {
					void refetch()
				}}
			>
				<MasonryLayout
					estimateItemSize={estimateEntitySize}
					gap={16}
					getItemKey={getEntityKey}
					getScrollElement={getScrollElement}
					items={entityItems}
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
							handleAddPrerequisite(entityType, entity.id)
						}
					}}
					open={showSearchDialog}
					title='Search prerequisites'
				/>
			)}

			{sourceId && (
				<AddTopicDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateTopicDialog}
					open={showCreateTopicDialog}
					relationship={{ kind: 'sourcePrerequisite', sourceId }}
				/>
			)}

			{sourceId && (
				<AddSourceDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateSourceDialog}
					open={showCreateSourceDialog}
					relationship={{ kind: 'sourcePrerequisite', sourceId }}
				/>
			)}
		</div>
	)
}
