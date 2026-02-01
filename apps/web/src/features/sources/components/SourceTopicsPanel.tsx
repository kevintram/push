import { useQueryClient } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { LearnablePanel } from '~/components/LearnablePanel'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/AddEntityMenu'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import { useAddSourceTopic } from '../api/addSourceTopic'
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
	 * Custom card renderer. If not provided, uses default TopicCard.
	 * @param topic - The topic to render
	 * @param onRemove - Callback to remove the relationship
	 * @param onClick - Callback when the card is clicked
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
	renderCard
}: SourceTopicsPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	// Use prop directly - topics comes from the single getSource fetch
	const topics = topicsProp ?? []

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

	const estimateItemSize = useCallback((topic: Topic) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const nameHeight =
			Math.floor((topic.name?.length ?? 0) / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor((topic.notes?.length ?? 0) / numCharsPerLine) * lineHeight

		return baseHeight + nameHeight + newLine + notesHeight
	}, [])

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

			// Use custom renderer if provided
			if (renderCard) {
				return renderCard(topic, handleRemoveRelationship, handleClick)
			}

			// Default card rendering
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

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	const actions = (
		<>
			<AddEntityMenu
				createItems={[
					{
						label: 'Create Topic',
						onSelect: () => setShowCreateDialog(true)
					}
				]}
				isLoading={isAdding}
				onSearch={() => setShowSearchDialog(true)}
				searchLabel='Search Topics'
			/>

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
					context={{ type: 'source', sourceId }}
					onOpenChange={setShowCreateDialog}
					open={showCreateDialog}
				/>
			)}
		</>
	)

	return (
		<LearnablePanel
			actions={actions}
			estimateItemSize={estimateItemSize}
			getItemKey={getItemKey}
			getScrollElement={getScrollElement}
			icon={BookOpen}
			items={topics}
			label='Topics covered'
			renderItem={renderItem}
			scrollMargin={scrollMargin}
		/>
	)
}
