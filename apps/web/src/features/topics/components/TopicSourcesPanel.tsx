import { BookMarked, ChevronDown, Loader2, Plus, Search } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { LearnablePanel } from '~/components/LearnablePanel'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { SourceCard } from '~/features/sources/components/SourceCard'
import type { Source } from '~/features/sources/types/source.types'
import { useAddTopicSource } from '../api/addTopicSource'
import { AddSourceToTopicDialog } from './AddSourceToTopicDialog'

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
	renderCard
}: TopicSourcesPanelProps) {
	const [showAddDialog, setShowAddDialog] = useState(false)
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

	const estimateItemSize = useCallback((source: Source) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const titleHeight =
			Math.floor((source.title?.length ?? 0) / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor((source.notes?.length ?? 0) / numCharsPerLine) * lineHeight

		return baseHeight + titleHeight + newLine + notesHeight
	}, [])

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
			<DropdownMenu>
				<DropdownMenuTrigger asChild={true} disabled={isAdding}>
					<Button className='gap-1' size='sm' variant='secondary'>
						{isAdding ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Plus className='h-4 w-4' />
						)}
						Add
						<ChevronDown className='h-4 w-4' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='start'>
					<DropdownMenuItem onClick={() => setShowAddDialog(true)}>
						<Search className='h-4 w-4' />
						Search Sources
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AddSourceToTopicDialog
				existingSourceIds={existingSourceIds}
				onOpenChange={setShowAddDialog}
				onSelected={handleAddSource}
				open={showAddDialog}
			/>
		</>
	) : undefined

	return (
		<LearnablePanel
			actions={actions}
			estimateItemSize={estimateItemSize}
			getItemKey={getItemKey}
			getScrollElement={getScrollElement}
			hideWhenEmpty={true}
			icon={BookMarked}
			items={sources}
			label='Sources'
			renderItem={renderItem}
			scrollMargin={scrollMargin}
		/>
	)
}
