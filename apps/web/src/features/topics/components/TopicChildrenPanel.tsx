import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DetailTabPanelState } from '~/components/DetailTabs'
import { estimateCardSize } from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import type { FsrsState } from '~/models/learnable.types'
import { useCreateRelationship } from '../api/createTopicRelationship'
import { useDeleteRelationship } from '../api/deleteTopicRelationship'
import { useTopicChildren } from '../api/getTopicChildren'
import { topicKeys } from '../api/queryKeys'
import type { Topic } from '../types/topic.types'
import { AddTopicDialog } from './AddTopicDialog'
import { TopicActionMenu } from './TopicActionMenu'
import { TopicCard } from './TopicCard'

const MIN_WIDTH = 280
const MIN_HEIGHT = 96

type ListItem = { type: 'child'; child: Topic }

interface TopicChildrenPanelProps {
	topicId: number | undefined
	/**
	 * Children topics from the single getTopic fetch.
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	children?: Array<Topic>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Parent topic's SRS fields for the "inherit SRS" option.
	 */
	inheritFsrsState?: FsrsState | null
	/**
	 * Called when a child is selected/clicked.
	 * If not provided, defaults to opening the topic dialog.
	 */
	onChildSelect?: (topicId: number) => void
	/**
	 * Custom card renderer. If not provided, uses default TopicCard.
	 * @param topic - The child topic to render
	 * @param onRemove - Callback to remove the relationship
	 * @param onClick - Callback when the card is clicked
	 */
	renderCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function TopicChildrenPanel({
	topicId,
	children: childrenProp,
	getScrollElement,
	scrollMargin,
	inheritFsrsState,
	onChildSelect,
	renderCard
}: TopicChildrenPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showAddTopicDialog, setShowAddTopicDialog] = useState(false)

	const childrenQuery = useTopicChildren(topicId, {
		enabled: childrenProp === undefined
	})
	const children = childrenProp ?? childrenQuery.data ?? []
	const isLoading = childrenProp === undefined && childrenQuery.isPending
	const isError = childrenProp === undefined && childrenQuery.isError

	const deleteRelationship = useDeleteRelationship()
	const createRelationship = useCreateRelationship()

	const isCreating = createRelationship.isPending

	const handleChildSelect = useCallback(
		(childTopicId: number) => {
			onChildSelect?.(childTopicId)
		},
		[onChildSelect]
	)

	const handleAddTopic = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			await createRelationship.mutateAsync({
				parent: topicId,
				child: topic.id
			})
		},
		[topicId, createRelationship]
	)

	const handleTopicUpdateSuccess = useCallback(
		(updatedTopic: Topic) => {
			queryClient.setQueryData(
				topicKeys.children(topicId!),
				(old: Array<Topic>) => {
					return old.map(child => {
						if (child.id === updatedTopic.id) {
							return updatedTopic
						}
						return child
					})
				}
			)
		},
		[queryClient, topicId]
	)

	const items = useMemo<Array<ListItem>>(
		() => children.map(child => ({ type: 'child' as const, child })),
		[children]
	)

	const estimateItemSize = useCallback(
		(item: ListItem, _index: number, laneWidth: number) =>
			estimateCardSize(item.child.name, item.child.notes, laneWidth),
		[]
	)

	const renderItem = useCallback(
		(item: ListItem) => {
			const handleRemoveRelationship = () => {
				if (!topicId) return
				deleteRelationship.mutate({
					parent: topicId,
					child: item.child.id
				})
			}

			const handleClick = () => {
				handleChildSelect(item.child.id)
			}

			if (renderCard) {
				return renderCard(item.child, handleRemoveRelationship, handleClick)
			}

			return (
				<TopicCard
					headerRight={
						<TopicActionMenu
							onRemoveRelationship={handleRemoveRelationship}
							onTopicUpdateSuccess={handleTopicUpdateSuccess}
							removeRelationshipText='Remove as Child'
							topic={item.child}
						/>
					}
					minHeight={MIN_HEIGHT}
					onTopicClick={() => handleClick()}
					topic={item.child}
				/>
			)
		},
		[
			deleteRelationship,
			topicId,
			handleChildSelect,
			renderCard,
			handleTopicUpdateSuccess
		]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		return item.child.id
	}, [])

	return (
		<div className='flex flex-col gap-4'>
			{topicId && (
				<div className='flex justify-end'>
					<AddEntityMenu
						createItems={[
							{
								label: 'Create Topic',
								onSelect: () => setShowAddTopicDialog(true)
							}
						]}
						isLoading={isCreating}
						onSearch={() => setShowSearchDialog(true)}
						searchLabel='Search Topics'
					/>
				</div>
			)}

			<DetailTabPanelState
				emptyMessage='No child topics'
				error={childrenQuery.error}
				isEmpty={items.length === 0}
				isError={isError}
				isLoading={isLoading}
				isRefreshing={
					childrenProp === undefined && childrenQuery.isFetching && !isLoading
				}
				onRetry={() => {
					void childrenQuery.refetch()
				}}
			>
				<MasonryLayout
					estimateItemSize={estimateItemSize}
					gap={16}
					getItemKey={getItemKey}
					getScrollElement={getScrollElement}
					items={items}
					minItemWidth={MIN_WIDTH}
					renderItem={renderItem}
					scrollMargin={scrollMargin}
				/>
			</DetailTabPanelState>

			{topicId && (
				<EntitySearchDialog
					defaultType='topic'
					entityTypes={['topic']}
					existingIds={{
						topic: children.map(child => child.id)
					}}
					onOpenChange={setShowSearchDialog}
					onSelected={(_type, topic) => handleAddTopic(topic as Topic)}
					open={showSearchDialog}
					title='Search child topics'
					topicSearchParams={{
						addableAsChildTo: topicId
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
								onClick: () => handleChildSelect(newTopicId)
							}
						})
					}}
					open={showAddTopicDialog}
					relationship={{
						kind: 'child',
						parentTopicId: topicId
					}}
				/>
			)}
		</div>
	)
}
