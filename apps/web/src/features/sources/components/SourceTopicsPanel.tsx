import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { DetailTabPanelState } from '~/components/DetailTabs'
import { estimateCardSize } from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddSourceTopic } from '../api/addSourceTopic'
import { useSourceTopics } from '../api/getSourceTopics'
import { sourceKeys } from '../api/queryKeys'
import { useRemoveSourceTopic } from '../api/removeSourceTopic'

const MIN_HEIGHT = 96

interface SourceTopicsPanelProps {
	sourceId: number | undefined
	/**
	 * Topics from the single getSource fetch.
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	topics?: Array<Topic>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Called when a topic is selected/clicked.
	 */
	onTopicSelect?: (topicId: number) => void
	/**
	 * FSRS state to pass for inheritance when creating topics.
	 */
	inheritFsrsState?: FsrsState | null
	/**
	 * Custom card renderer. If not provided, uses default TopicCard.
	 */
	renderCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function SourceTopicsPanel({
	sourceId,
	topics: topicsProp,
	getScrollElement,
	scrollMargin,
	onTopicSelect,
	renderCard,
	inheritFsrsState
}: SourceTopicsPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	const topicsQuery = useSourceTopics(sourceId, {
		enabled: topicsProp === undefined
	})
	const topics = topicsProp ?? topicsQuery.data ?? []
	const isLoading = topicsProp === undefined && topicsQuery.isPending
	const isError = topicsProp === undefined && topicsQuery.isError

	const addSourceTopic = useAddSourceTopic()
	const removeSourceTopic = useRemoveSourceTopic()

	const isAdding = addSourceTopic.isPending

	const handleAdd = useCallback(
		async (topic: Topic) => {
			if (!sourceId) return

			await addSourceTopic.mutateAsync({
				sourceId,
				data: { topic_id: topic.id }
			})
		},
		[sourceId, addSourceTopic]
	)

	const handleTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(
				sourceKeys.topics(sourceId!),
				(old: Array<Topic>) => {
					return (
						old?.map(topic => {
							if (topic.id === updatedTopic.id) {
								return updatedTopic
							}
							return topic
						}) ?? []
					)
				}
			)
		},
		[queryClient, sourceId]
	)

	const existingTopicIds = useMemo(() => topics.map(t => t.id), [topics])

	const estimateItemSize = useCallback(
		(topic: Topic, _index: number, laneWidth: number) =>
			estimateCardSize(topic.name ?? '', topic.notes ?? '', laneWidth),
		[]
	)

	const renderItem = useCallback(
		(topic: Topic) => {
			const handleRemoveRelationship = () => {
				if (!sourceId) return
				removeSourceTopic.mutate({
					sourceId,
					topicId: topic.id
				})
			}

			const handleClick = () => {
				onTopicSelect?.(topic.id)
			}

			if (renderCard) {
				return renderCard(topic, handleRemoveRelationship, handleClick)
			}

			return (
				<TopicCard
					headerRight={
						<TopicActionMenu
							onRemoveRelationship={handleRemoveRelationship}
							onTopicUpdateSuccess={handleTopicUpdateSuccess}
							removeRelationshipText='Remove from Source'
							topic={topic}
						/>
					}
					minHeight={MIN_HEIGHT}
					onTopicClick={handleClick}
					topic={topic}
				/>
			)
		},
		[
			onTopicSelect,
			renderCard,
			handleTopicUpdateSuccess,
			sourceId,
			removeSourceTopic
		]
	)

	const getItemKey = useCallback((topic: Topic, _index: number) => {
		return topic.id
	}, [])

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex justify-end'>
				<AddEntityMenu
					createItems={[
						{
							label: 'Create',
							onSelect: () => setShowCreateDialog(true)
						}
					]}
					isLoading={isAdding}
					onSearch={() => setShowSearchDialog(true)}
					searchLabel='Search'
				/>
			</div>

			<DetailTabPanelState
				emptyMessage='No related topics'
				error={topicsQuery.error}
				isEmpty={topics.length === 0}
				isError={isError}
				isLoading={isLoading}
				isRefreshing={
					topicsProp === undefined && topicsQuery.isFetching && !isLoading
				}
				onRetry={() => {
					void topicsQuery.refetch()
				}}
			>
				<MasonryLayout
					estimateItemSize={estimateItemSize}
					gap={16}
					getItemKey={getItemKey}
					getScrollElement={getScrollElement}
					items={topics}
					renderItem={renderItem}
					scrollMargin={scrollMargin}
				/>
			</DetailTabPanelState>

			<EntitySearchDialog
				defaultType='topic'
				entityTypes={['topic']}
				existingIds={{ topic: existingTopicIds }}
				onOpenChange={setShowSearchDialog}
				onSelected={(_type, topic) => handleAdd(topic as Topic)}
				open={showSearchDialog}
				title='Search topics'
			/>

			{sourceId !== undefined && (
				<AddTopicDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateDialog}
					open={showCreateDialog}
					relationship={{ kind: 'source', sourceId }}
				/>
			)}
		</div>
	)
}
