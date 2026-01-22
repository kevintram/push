import { BookMarked } from 'lucide-react'
import { type ReactNode, useCallback } from 'react'
import { LearnablePanel } from '~/components/LearnablePanel'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { SourceCard } from '~/features/sources/components/SourceCard'
import type { Source } from '~/features/sources/types/source.types'

const MIN_HEIGHT = 96

interface TopicSourcesPanelProps {
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
	sources: sourcesProp,
	getScrollElement,
	scrollMargin,
	onSourceSelect,
	renderCard
}: TopicSourcesPanelProps) {
	// Use prop directly - sources comes from the single getTopic fetch
	const sources = sourcesProp ?? []

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

	return (
		<LearnablePanel
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
