import { BookMarked } from 'lucide-react'
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
import { useAddTopicSource } from '../api/addTopicSource'

const MIN_HEIGHT = 96

interface TopicSourcesPanelProps {
	topicId?: number
	/**
	 * Sources from the single getTopic fetch.
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	sources?: Array<Source>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Called when a source is selected/clicked.
	 */
	onSourceSelect?: (sourceId: number) => void
	/**
	 * FSRS state to pass for inheritance when creating sources.
	 */
	inheritFsrsState?: FsrsState | null
	/**
	 * Custom card renderer. If not provided, uses default SourceCard.
	 * @param source - The source to render
	 * @param onClick - Callback when the card is clicked
	 */
	renderCard?: (source: Source, onClick: () => void) => ReactNode
}

export function TopicSourcesPanel({
	topicId,
	sources: sourcesProp,
	getScrollElement,
	scrollMargin,
	onSourceSelect,
	renderCard,
	inheritFsrsState
}: TopicSourcesPanelProps) {
	const [showAddDialog, setShowAddDialog] = useState(false)
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const addSourceMutation = useAddTopicSource()
	const isAdding = addSourceMutation.isPending

	// Use prop directly - sources comes from the single getTopic fetch
	const sources = sourcesProp ?? []

	// Get existing source IDs to filter from search
	const existingSourceIds = useMemo(() => sources.map(s => s.id), [sources])

	const handleAddSource = useCallback(
		async (source: Source) => {
			if (!topicId) return
			await addSourceMutation.mutateAsync({
				topicId,
				sourceId: source.id
			})
		},
		[topicId, addSourceMutation]
	)

	const estimateItemSize = useCallback(
		(source: Source, _index: number, laneWidth: number) =>
			estimateCardSize(source.title ?? '', source.notes ?? '', laneWidth),
		[]
	)

	const renderItem = useCallback(
		(source: Source) => {
			const handleClick = () => {
				onSourceSelect?.(source.id)
			}

			// Use custom renderer if provided
			if (renderCard) {
				return renderCard(source, handleClick)
			}

			// Default card rendering (read-only - no remove button)
			return (
				<SourceCard
					headerRight={<SourceActionMenu source={source} />}
					minHeight={MIN_HEIGHT}
					onSourceClick={handleClick}
					source={source}
				/>
			)
		},
		[onSourceSelect, renderCard]
	)

	const getItemKey = useCallback((source: Source) => source.id, [])

	const actions = topicId ? (
		<>
			<AddEntityMenu
				createItems={[
					{
						label: 'Create Source',
						onSelect: () => setShowCreateDialog(true)
					}
				]}
				isLoading={isAdding}
				onSearch={() => setShowAddDialog(true)}
				searchLabel='Search Sources'
			/>

			{topicId && (
				<EntitySearchDialog
					defaultType='source'
					entityTypes={['source']}
					existingIds={{ source: existingSourceIds }}
					onOpenChange={setShowAddDialog}
					onSelected={(_type, source) => handleAddSource(source as Source)}
					open={showAddDialog}
					title='Search sources'
				/>
			)}

			{topicId && (
				<AddSourceDialog
					inherit={
						inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined
					}
					onOpenChange={setShowCreateDialog}
					open={showCreateDialog}
					relationship={{ kind: 'topic', topicId }}
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
			icon={BookMarked}
			items={sources}
			label='Sources'
			renderItem={renderItem}
			scrollMargin={scrollMargin}
		/>
	)
}
