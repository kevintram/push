import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { estimateCardSize } from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/AddEntityMenu'
import { AddPracticeDialog } from '~/features/practices/components/AddPracticeDialog'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { PracticeCard } from '~/features/practices/components/PracticeCard'
import type { Practice } from '~/features/practices/types/practice.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddTopicPractice } from '../api/addTopicPractice'
import { topicKeys } from '../api/queryKeys'
import { useRemoveTopicPractice } from '../api/removeTopicPractice'

const MIN_WIDTH = 280
const MIN_HEIGHT = 96

interface TopicPracticesPanelProps {
	topicId: number | undefined
	/**
	 * Practices from the single getTopic fetch.
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	practices?: Array<Practice>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Called when a practice is selected/clicked.
	 */
	onPracticeSelect?: (practiceId: number) => void
	/**
	 * FSRS state to pass for inheritance when creating practices.
	 */
	inheritFsrsState?: FsrsState | null
	/**
	 * Custom card renderer. If not provided, uses default PracticeCard.
	 * @param practice - The practice to render
	 * @param onRemove - Callback to remove the relationship
	 * @param onClick - Callback when the card is clicked
	 */
	renderCard?: (
		practice: Practice,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function TopicPracticesPanel({
	topicId,
	practices: practicesProp,
	getScrollElement,
	scrollMargin,
	onPracticeSelect,
	renderCard,
	inheritFsrsState
}: TopicPracticesPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	const practices = practicesProp ?? []

	const addTopicPractice = useAddTopicPractice()
	const removeTopicPractice = useRemoveTopicPractice()

	const isAdding = addTopicPractice.isPending

	const handleAdd = useCallback(
		async (practice: Practice) => {
			if (!topicId) return

			await addTopicPractice.mutateAsync({
				topicId,
				practiceId: practice.id
			})
		},
		[topicId, addTopicPractice]
	)

	const handlePracticeUpdateSuccess = useCallback(
		(updatedPractice: Practice) => {
			queryClient.setQueryData(
				topicKeys.detail(topicId!),
				(old: { practices?: Array<Practice> } | undefined) => {
					if (!old) return old
					return {
						...old,
						practices:
							old.practices?.map(practice =>
								practice.id === updatedPractice.id ? updatedPractice : practice
							) ?? []
					}
				}
			)
		},
		[queryClient, topicId]
	)

	const existingPracticeIds = useMemo(
		() => practices.map(p => p.id),
		[practices]
	)

	const estimateItemSize = useCallback(
		(practice: Practice, _index: number, laneWidth: number) =>
			estimateCardSize(practice.prompt ?? '', practice.answer ?? '', laneWidth),
		[]
	)

	const renderItem = useCallback(
		(practice: Practice) => {
			const handleRemoveRelationship = () => {
				if (!topicId) return
				removeTopicPractice.mutate({
					topicId,
					practiceId: practice.id
				})
			}

			const handleClick = () => {
				onPracticeSelect?.(practice.id)
			}

			if (renderCard) {
				return renderCard(practice, handleRemoveRelationship, handleClick)
			}

			return (
				<PracticeCard
					headerRight={
						<PracticeActionMenu
							onPracticeUpdateSuccess={handlePracticeUpdateSuccess}
							onRemoveRelationship={handleRemoveRelationship}
							practice={practice}
							removeRelationshipText='Remove from Topic'
						/>
					}
					minHeight={MIN_HEIGHT}
					onPracticeClick={handleClick}
					practice={practice}
				/>
			)
		},
		[
			onPracticeSelect,
			renderCard,
			handlePracticeUpdateSuccess,
			topicId,
			removeTopicPractice
		]
	)

	const getItemKey = useCallback((practice: Practice, _index: number) => {
		return practice.id
	}, [])

	return (
		<div className='flex flex-col gap-4'>
			{topicId && (
				<div className='flex justify-end'>
					<AddEntityMenu
						createItems={[
							{
								label: 'Create Practice',
								onSelect: () => setShowCreateDialog(true)
							}
						]}
						isLoading={isAdding}
						onSearch={() => setShowSearchDialog(true)}
						searchLabel='Search Practices'
					/>
				</div>
			)}

			{practices.length === 0 ? (
				<p className='py-2 text-muted-foreground text-sm'>No practices</p>
			) : (
				<MasonryLayout
					estimateItemSize={estimateItemSize}
					gap={16}
					getItemKey={getItemKey}
					getScrollElement={getScrollElement}
					items={practices}
					minItemWidth={MIN_WIDTH}
					renderItem={renderItem}
					scrollMargin={scrollMargin}
				/>
			)}

			<EntitySearchDialog
				defaultType='practice'
				entityTypes={['practice']}
				existingIds={{ practice: existingPracticeIds }}
				onOpenChange={setShowSearchDialog}
				onSelected={(_type, practice) => handleAdd(practice as Practice)}
				open={showSearchDialog}
				title='Search practices'
			/>

			{topicId && (
				<AddPracticeDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateDialog}
					open={showCreateDialog}
					relationship={{ kind: 'topic', topicId }}
				/>
			)}
		</div>
	)
}
