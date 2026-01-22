import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { type ReactNode, useCallback, useState } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'

const MIN_WIDTH = 280
const MIN_HEIGHT = 96

interface LearnablePanelProps<T> {
	/** Items to display in the masonry layout */
	items: T[]
	/** Icon to display in the panel header */
	icon: LucideIcon
	/** Label for the panel (e.g., "Child topics", "Sources") */
	label: string
	/** Whether the panel starts collapsed */
	defaultCollapsed?: boolean
	/** Actions to render in the header (e.g., Add dropdown) */
	actions?: ReactNode
	/** Render function for each item */
	renderItem: (item: T) => ReactNode
	/** Estimate the height of an item for masonry layout */
	estimateItemSize: (item: T) => number
	/** Get a unique key for an item */
	getItemKey: (item: T) => number | string
	/** Scroll container element getter for virtualization */
	getScrollElement?: () => HTMLDivElement | null
	/** Scroll margin for virtualization */
	scrollMargin?: number
	/** Hide the panel when there are no items. Defaults to false. */
	hideWhenEmpty?: boolean
}

export function LearnablePanel<T>({
	items,
	icon: Icon,
	label,
	defaultCollapsed = false,
	actions,
	renderItem,
	estimateItemSize,
	getItemKey,
	getScrollElement,
	scrollMargin,
	hideWhenEmpty = false
}: LearnablePanelProps<T>) {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

	const wrappedEstimateItemSize = useCallback(
		(item: T) => {
			const calculated = estimateItemSize(item)
			return Math.max(calculated, MIN_HEIGHT)
		},
		[estimateItemSize]
	)

	const wrappedGetItemKey = useCallback(
		(item: T, _index: number) => {
			return getItemKey(item)
		},
		[getItemKey]
	)

	// Hide panel if empty and hideWhenEmpty is true
	if (hideWhenEmpty && items.length === 0) {
		return null
	}

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				actions={actions}
				label={
					<Button
						className='flex items-center gap-2 p-0'
						onClick={() => setIsCollapsed(!isCollapsed)}
						variant='ghost'
					>
						<Icon className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-sm'>
							{label} ({items.length})
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
						estimateItemSize={wrappedEstimateItemSize}
						gap={16}
						getItemKey={wrappedGetItemKey}
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
