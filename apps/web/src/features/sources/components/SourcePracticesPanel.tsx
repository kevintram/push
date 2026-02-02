import { useQueryClient } from '@tanstack/react-query'
import { Dumbbell } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { LearnablePanel } from '~/components/LearnablePanel'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/AddEntityMenu'
import { AddPracticeDialog } from '~/features/practices/components/AddPracticeDialog'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { PracticeCard } from '~/features/practices/components/PracticeCard'
import type { Practice } from '~/features/practices/types/practice.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddSourcePractice } from '../api/addSourcePractice'
import { sourceKeys } from '../api/queryKeys'
import { useRemoveSourcePractice } from '../api/removeSourcePractice'

const MIN_HEIGHT = 96

interface SourcePracticesPanelProps {
	sourceId: number | undefined
	/**
	 * Practices from the single getSource fetch.
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

export function SourcePracticesPanel({
	sourceId,
	practices: practicesProp,
	getScrollElement,
	scrollMargin,
	onPracticeSelect,
	renderCard,
	inheritFsrsState
}: SourcePracticesPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	// Use prop directly - practices comes from the single getSource fetch
	const practices = practicesProp ?? []

	const addSourcePractice = useAddSourcePractice()
	const removeSourcePractice = useRemoveSourcePractice()

	const isAdding = addSourcePractice.isPending

	const handleAdd = useCallback(
		async (practice: Practice) => {
			if (!sourceId) return

			await addSourcePractice.mutateAsync({
				sourceId,
				practiceId: practice.id
			})
		},
		[sourceId, addSourcePractice]
	)

	const handlePracticeUpdateSuccess = useCallback(
		(updatedPractice: Practice) => {
			queryClient.setQueryData(
				sourceKeys.detail(sourceId!),
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
		[queryClient, sourceId]
	)

	const existingPracticeIds = useMemo(
		() => practices.map(p => p.id),
		[practices]
	)

	const estimateItemSize = useCallback((practice: Practice) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const promptHeight =
			Math.floor((practice.prompt?.length ?? 0) / numCharsPerLine) * lineHeight
		const answerHeight =
			Math.floor((practice.answer?.length ?? 0) / numCharsPerLine) * lineHeight

		return baseHeight + promptHeight + newLine + answerHeight
	}, [])

	const renderItem = useCallback(
		(practice: Practice) => {
			const handleRemoveRelationship = () => {
				if (!sourceId) return
				removeSourcePractice.mutate({
					sourceId,
					practiceId: practice.id
				})
			}

			const handleClick = () => {
				onPracticeSelect?.(practice.id)
			}

			// Use custom renderer if provided
			if (renderCard) {
				return renderCard(practice, handleRemoveRelationship, handleClick)
			}

			// Default card rendering
			return (
				<PracticeCard
					headerRight={
						<PracticeActionMenu
							onPracticeUpdateSuccess={handlePracticeUpdateSuccess}
							onRemoveRelationship={handleRemoveRelationship}
							practice={practice}
							removeRelationshipText='Remove from Source'
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
			sourceId,
			removeSourcePractice
		]
	)

	const getItemKey = useCallback((practice: Practice) => practice.id, [])

	const actions = sourceId ? (
		<>
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

			<EntitySearchDialog
				defaultType='practice'
				entityTypes={['practice']}
				existingIds={{ practice: existingPracticeIds }}
				onOpenChange={setShowSearchDialog}
				onSelected={(_type, practice) => handleAdd(practice as Practice)}
				open={showSearchDialog}
				title='Search practices'
			/>

			{sourceId && (
				<AddPracticeDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateDialog}
					open={showCreateDialog}
					relationship={{ kind: 'source', sourceId }}
				/>
			)}
		</>
	) : undefined

	return (
		<LearnablePanel
			actions={actions}
			estimateItemSize={estimateItemSize}
			getItemKey={getItemKey}
			getScrollElement={getScrollElement}
			icon={Dumbbell}
			items={practices}
			label='Practices'
			renderItem={renderItem}
			scrollMargin={scrollMargin}
		/>
	)
}
