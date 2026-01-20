import { BookMarked, ChevronDown } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { SourceCard } from '~/features/sources/components/SourceCard'
import type { Source } from '~/features/sources/types/source.types'

const MIN_WIDTH = 280
const MIN_HEIGHT = 96

type ListItem = { type: 'source'; source: Source }

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
	const [isCollapsed, setIsCollapsed] = useState(false)

	// Use prop directly - sources comes from the single getTopic fetch
	const sources = sourcesProp ?? []

	// Determine navigation behavior
	const handleSourceSelect = useCallback(
		(sourceId: number) => {
			onSourceSelect?.(sourceId)
		},
		[onSourceSelect]
	)

	// Map sources into array
	const items = useMemo<Array<ListItem>>(
		() => sources.map(source => ({ type: 'source' as const, source })),
		[sources]
	)

	const estimateItemSize = useCallback((item: ListItem) => {
		// Estimate height based on source title and notes length
		const { source } = item
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const titleHeight =
			Math.floor((source.title?.length ?? 0) / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor((source.notes?.length ?? 0) / numCharsPerLine) * lineHeight

		const calculatedHeight = baseHeight + titleHeight + newLine + notesHeight

		return Math.max(calculatedHeight, MIN_HEIGHT)
	}, [])

	const renderItem = useCallback(
		(item: ListItem) => {
			const handleClick = () => {
				handleSourceSelect(item.source.id)
			}

			// Use custom renderer if provided
			if (renderCard) {
				return renderCard(item.source, handleClick)
			}

			// Default card rendering (read-only - no remove button)
			return (
				<SourceCard
					headerRight={<SourceActionMenu source={item.source} />}
					minHeight={MIN_HEIGHT}
					onSourceClick={() => handleClick()}
					source={item.source}
				/>
			)
		},
		[handleSourceSelect, renderCard]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		return item.source.id
	}, [])

	// Don't render the panel if there are no sources
	if (sources.length === 0) {
		return null
	}

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				label={
					<Button
						className='flex items-center gap-2 p-0'
						onClick={() => setIsCollapsed(!isCollapsed)}
						variant='ghost'
					>
						<BookMarked className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-sm'>
							Sources ({sources.length})
						</span>
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
						/>
					</Button>
				}
			/>
			{!isCollapsed && (
				<div className='flex-1 py-6'>
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
				</div>
			)}
		</div>
	)
}
