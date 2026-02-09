import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
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
import { AddEntityMenu } from '~/components/ui/AddEntityMenu'
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import type { Source } from '~/features/sources/types/source.types'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import type { Topic } from '~/features/topics/types/topic.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddPracticeSource } from '../api/addPracticeSource'
import { useAddPracticeTopic } from '../api/addPracticeTopic'
import { practiceKeys } from '../api/queryKeys'
import { useRemovePracticeSource } from '../api/removePracticeSource'
import { useRemovePracticeTopic } from '../api/removePracticeTopic'

type RelatedEntityItem = Extract<EntityItem, { type: 'topic' | 'source' }>

interface PracticeRelatedPanelProps {
	practiceId: number | undefined
	topics?: Array<Topic>
	sources?: Array<Source>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	inheritFsrsState?: FsrsState | null
	onTopicSelect?: (topicId: number) => void
	onSourceSelect?: (sourceId: number) => void
}

export function PracticeRelatedPanel({
	practiceId,
	topics: topicsProp,
	sources: sourcesProp,
	getScrollElement,
	scrollMargin,
	inheritFsrsState,
	onTopicSelect,
	onSourceSelect
}: PracticeRelatedPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateTopicDialog, setShowCreateTopicDialog] = useState(false)
	const [showCreateSourceDialog, setShowCreateSourceDialog] = useState(false)
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const topics = topicsProp ?? []
	const sources = sourcesProp ?? []

	const addPracticeTopic = useAddPracticeTopic()
	const addPracticeSource = useAddPracticeSource()
	const removePracticeTopic = useRemovePracticeTopic()
	const removePracticeSource = useRemovePracticeSource()

	const isAdding = addPracticeTopic.isPending || addPracticeSource.isPending

	const items = useMemo<Array<RelatedEntityItem>>(
		() => [
			...topics.map(topic => ({ type: 'topic' as const, item: topic })),
			...sources.map(source => ({ type: 'source' as const, item: source }))
		],
		[topics, sources]
	)

	const filteredItems = useMemo(() => {
		if (activeFilter === 'all') return items
		return items.filter(item => item.type === activeFilter)
	}, [activeFilter, items])

	const handleAddTopic = useCallback(
		async (topic: Topic) => {
			if (!practiceId) return
			await addPracticeTopic.mutateAsync({
				practiceId,
				topicId: topic.id
			})
		},
		[practiceId, addPracticeTopic]
	)

	const handleAddSource = useCallback(
		async (source: Source) => {
			if (!practiceId) return
			await addPracticeSource.mutateAsync({
				practiceId,
				sourceId: source.id
			})
		},
		[practiceId, addPracticeSource]
	)

	const handleTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(
				practiceKeys.detail(practiceId!),
				(old: { topics?: Array<Topic> } | undefined) => {
					if (!old) return old
					return {
						...old,
						topics:
							old.topics?.map(topic =>
								topic.id === updatedTopic.id ? updatedTopic : topic
							) ?? []
					}
				}
			)
		},
		[queryClient, practiceId]
	)

	const handleSourceUpdateSuccess = useCallback(
		(updatedSource: Source) => {
			queryClient.setQueryData(
				practiceKeys.detail(practiceId!),
				(old: { sources?: Array<Source> } | undefined) => {
					if (!old) return old
					return {
						...old,
						sources:
							old.sources?.map(source =>
								source.id === updatedSource.id ? updatedSource : source
							) ?? []
					}
				}
			)
		},
		[queryClient, practiceId]
	)

	const handleEntityClick = useCallback(
		(entity: EntityItem) => {
			if (entity.type === 'topic') {
				onTopicSelect?.(entity.item.id)
				return
			}
			if (entity.type === 'source') {
				onSourceSelect?.(entity.item.id)
			}
		},
		[onTopicSelect, onSourceSelect]
	)

	const renderItem = useCallback(
		(entity: RelatedEntityItem) => {
			if (entity.type === 'topic') {
				const handleRemoveRelationship = () => {
					if (!practiceId) return
					removePracticeTopic.mutate({
						practiceId,
						topicId: entity.item.id
					})
				}

				return (
					<EntityCard
						entity={entity}
						headerRight={
							<TopicActionMenu
								onRemoveRelationship={handleRemoveRelationship}
								onTopicUpdateSuccess={handleTopicUpdateSuccess}
								removeRelationshipText='Remove from Practice'
								topic={entity.item}
							/>
						}
						minHeight={96}
						onEntityClick={handleEntityClick}
					/>
				)
			}
			const handleRemoveRelationship = () => {
				if (!practiceId) return
				removePracticeSource.mutate({
					practiceId,
					sourceId: entity.item.id
				})
			}

			return (
				<EntityCard
					entity={entity}
					headerRight={
						<SourceActionMenu
							onRemoveRelationship={handleRemoveRelationship}
							onSourceUpdateSuccess={handleSourceUpdateSuccess}
							removeRelationshipText='Remove from Practice'
							source={entity.item}
						/>
					}
					minHeight={96}
					onEntityClick={handleEntityClick}
				/>
			)
		},
		[
			handleEntityClick,
			handleSourceUpdateSuccess,
			handleTopicUpdateSuccess,
			practiceId,
			removePracticeSource,
			removePracticeTopic
		]
	)

	const existingTopicIds = useMemo(
		() => topics.map(topic => topic.id),
		[topics]
	)
	const existingSourceIds = useMemo(
		() => sources.map(source => source.id),
		[sources]
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

			{filteredItems.length === 0 ? (
				<p className='py-2 text-muted-foreground text-sm'>No related items</p>
			) : (
				<MasonryLayout
					estimateItemSize={estimateEntitySize}
					gap={16}
					getItemKey={getEntityKey}
					getScrollElement={getScrollElement}
					items={filteredItems}
					minItemWidth={280}
					renderItem={renderItem}
					scrollMargin={scrollMargin}
				/>
			)}

			<EntitySearchDialog
				entityTypes={['topic', 'source']}
				existingIds={{
					topic: existingTopicIds,
					source: existingSourceIds
				}}
				onOpenChange={setShowSearchDialog}
				onSelected={(entityType, entity) => {
					if (entityType === 'topic') {
						handleAddTopic(entity as Topic)
					}
					if (entityType === 'source') {
						handleAddSource(entity as Source)
					}
				}}
				open={showSearchDialog}
				title='Search related entities'
			/>

			{practiceId && (
				<AddTopicDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateTopicDialog}
					open={showCreateTopicDialog}
					relationship={{ kind: 'practice', practiceId }}
				/>
			)}

			{practiceId && (
				<AddSourceDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateSourceDialog}
					open={showCreateSourceDialog}
					relationship={{ kind: 'practice', practiceId }}
				/>
			)}
		</div>
	)
}
