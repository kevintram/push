import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { DetailTabPanelState } from '~/components/DetailTabs'
import { estimateCardSize } from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import { AddPracticeDialog } from '~/features/practices/components/AddPracticeDialog'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { PracticeCard } from '~/features/practices/components/PracticeCard'
import type { Practice } from '~/features/practices/types/practice.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddSourcePractice } from '../api/addSourcePractice'
import { useSourcePractices } from '../api/getSourcePractices'
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

	const practicesQuery = useSourcePractices(sourceId, {
		enabled: practicesProp === undefined
	})
	const practices = practicesProp ?? practicesQuery.data ?? []
	const isLoading = practicesProp === undefined && practicesQuery.isPending
	const isError = practicesProp === undefined && practicesQuery.isError

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
				sourceKeys.practices(sourceId!),
				(old: Array<Practice> | undefined) => {
					if (!old) return old
					return old.map(practice =>
						practice.id === updatedPractice.id ? updatedPractice : practice
					)
				}
			)
		},
		[queryClient, sourceId]
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
				if (!sourceId) return
				removeSourcePractice.mutate({
					sourceId,
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

	const getItemKey = useCallback((practice: Practice, _index: number) => {
		return practice.id
	}, [])

	return (
		<div className='flex flex-col gap-4'>
			{sourceId && (
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
			)}

			<DetailTabPanelState
				emptyMessage='No practices'
				error={practicesQuery.error}
				isEmpty={practices.length === 0}
				isError={isError}
				isLoading={isLoading}
				isRefreshing={
					practicesProp === undefined && practicesQuery.isFetching && !isLoading
				}
				onRetry={() => {
					void practicesQuery.refetch()
				}}
			>
				<MasonryLayout
					estimateItemSize={estimateItemSize}
					gap={16}
					getItemKey={getItemKey}
					getScrollElement={getScrollElement}
					items={practices}
					renderItem={renderItem}
					scrollMargin={scrollMargin}
				/>
			</DetailTabPanelState>

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
		</div>
	)
}
