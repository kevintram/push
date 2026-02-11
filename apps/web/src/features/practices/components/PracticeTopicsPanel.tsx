import { useQueryClient } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { estimateCardSize } from '~/components/EntityCard'
import { LearnablePanel } from '~/components/LearnablePanel'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddPracticeTopic } from '../api/addPracticeTopic'
import { practiceKeys } from '../api/queryKeys'
import { useRemovePracticeTopic } from '../api/removePracticeTopic'

const MIN_HEIGHT = 96

interface PracticeTopicsPanelProps {
	practiceId: number | undefined
	topics?: Array<Topic>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	inheritFsrsState?: FsrsState | null
	onTopicSelect?: (topicId: number) => void
	renderCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function PracticeTopicsPanel({
	practiceId,
	topics: topicsProp,
	getScrollElement,
	scrollMargin,
	inheritFsrsState,
	onTopicSelect,
	renderCard
}: PracticeTopicsPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	const topics = topicsProp ?? []

	const addPracticeTopic = useAddPracticeTopic()
	const removePracticeTopic = useRemovePracticeTopic()

	const isAdding = addPracticeTopic.isPending

	const handleAdd = useCallback(
		async (topic: Topic) => {
			if (!practiceId) return

			await addPracticeTopic.mutateAsync({
				practiceId,
				topicId: topic.id
			})
		},
		[practiceId, addPracticeTopic]
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

	const existingTopicIds = useMemo(() => topics.map(t => t.id), [topics])

	const estimateItemSize = useCallback(
		(topic: Topic, _index: number, laneWidth: number) =>
			estimateCardSize(topic.name ?? '', topic.notes ?? '', laneWidth),
		[]
	)

	const renderItem = useCallback(
		(topic: Topic) => {
			const handleRemoveRelationship = () => {
				if (!practiceId) return
				removePracticeTopic.mutate({
					practiceId,
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
							removeRelationshipText='Remove from Practice'
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
			practiceId,
			removePracticeTopic
		]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	const actions = (
		<>
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

			<EntitySearchDialog
				defaultType='topic'
				entityTypes={['topic']}
				existingIds={{ topic: existingTopicIds }}
				onOpenChange={setShowSearchDialog}
				onSelected={(_type, topic) => handleAdd(topic as Topic)}
				open={showSearchDialog}
				title='Search topics'
			/>

			{practiceId && (
				<AddTopicDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateDialog}
					open={showCreateDialog}
					relationship={{ kind: 'practice', practiceId }}
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
			label='Related Topics'
			renderItem={renderItem}
			scrollMargin={scrollMargin}
		/>
	)
}
