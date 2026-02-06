import { useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { estimateCardSize } from '~/components/EntityCard'
import { LearnablePanel } from '~/components/LearnablePanel'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/AddEntityMenu'
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { SourceCard } from '~/features/sources/components/SourceCard'
import type { Source } from '~/features/sources/types/source.types'
import type { FsrsState } from '~/models/learnable.types'
import { useAddPracticeSource } from '../api/addPracticeSource'
import { practiceKeys } from '../api/queryKeys'
import { useRemovePracticeSource } from '../api/removePracticeSource'

const MIN_HEIGHT = 96

interface PracticeSourcesPanelProps {
	practiceId: number | undefined
	sources?: Array<Source>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	inheritFsrsState?: FsrsState | null
	onSourceSelect?: (sourceId: number) => void
	renderCard?: (
		source: Source,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function PracticeSourcesPanel({
	practiceId,
	sources: sourcesProp,
	getScrollElement,
	scrollMargin,
	inheritFsrsState,
	onSourceSelect,
	renderCard
}: PracticeSourcesPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	const sources = sourcesProp ?? []

	const addPracticeSource = useAddPracticeSource()
	const removePracticeSource = useRemovePracticeSource()

	const isAdding = addPracticeSource.isPending

	const handleAdd = useCallback(
		async (source: Source) => {
			if (!practiceId) return

			await addPracticeSource.mutateAsync({
				practiceId,
				sourceId: source.id
			})
		},
		[practiceId, addPracticeSource]
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

	const existingSourceIds = useMemo(() => sources.map(s => s.id), [sources])

	const estimateItemSize = useCallback(
		(source: Source, _index: number, laneWidth: number) =>
			estimateCardSize(source.title ?? '', source.notes ?? '', laneWidth),
		[]
	)

	const renderItem = useCallback(
		(source: Source) => {
			const handleRemoveRelationship = () => {
				if (!practiceId) return
				removePracticeSource.mutate({
					practiceId,
					sourceId: source.id
				})
			}

			const handleClick = () => {
				onSourceSelect?.(source.id)
			}

			if (renderCard) {
				return renderCard(source, handleRemoveRelationship, handleClick)
			}

			return (
				<SourceCard
					headerRight={
						<SourceActionMenu
							onRemoveRelationship={handleRemoveRelationship}
							onSourceUpdateSuccess={handleSourceUpdateSuccess}
							removeRelationshipText='Remove from Practice'
							source={source}
						/>
					}
					minHeight={MIN_HEIGHT}
					onSourceClick={handleClick}
					source={source}
				/>
			)
		},
		[
			onSourceSelect,
			renderCard,
			handleSourceUpdateSuccess,
			practiceId,
			removePracticeSource
		]
	)

	const getItemKey = useCallback((source: Source) => source.id, [])

	const actions = (
		<>
			<AddEntityMenu
				createItems={[
					{
						label: 'Create Source',
						onSelect: () => setShowCreateDialog(true)
					}
				]}
				isLoading={isAdding}
				onSearch={() => setShowSearchDialog(true)}
				searchLabel='Search Sources'
			/>

			<EntitySearchDialog
				defaultType='source'
				entityTypes={['source']}
				existingIds={{ source: existingSourceIds }}
				onOpenChange={setShowSearchDialog}
				onSelected={(_type, source) => handleAdd(source as Source)}
				open={showSearchDialog}
				title='Search sources'
			/>

			{practiceId && (
				<AddSourceDialog
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
			icon={FileText}
			items={sources}
			label='Related Sources'
			renderItem={renderItem}
			scrollMargin={scrollMargin}
		/>
	)
}
