import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { type ReactNode, useCallback, useState } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { Button } from '~/components/ui/button'
import { CountBadge } from '~/components/ui/count-badge'
import { TopicPanelHeader } from '~/components/ui/topic-panel-header'
import { cn } from '~/lib/utils'

const MIN_WIDTH = 280
const MIN_HEIGHT = 96

interface LearnablePanelProps<T> {
	/** Items to display in the masonry layout */
	items: Array<T>
	/** Icon to display in the panel header */
	icon: LucideIcon
	/** Label for the panel (e.g., "Child topics", "Sources") */
	label: string
	/** Whether the panel starts collapsed */
	defaultCollapsed?: boolean
	/** Actions to render in the header (e.g., Add dropdown) */
	actions?: ReactNode
	/** Render function for each item */
	renderItem: (item: T, index: number, laneWidth: number) => ReactNode
	/** Estimate the height of an item for masonry layout */
	estimateItemSize: (item: T, index: number, laneWidth: number) => number
	/** Get a unique key for an item */
	getItemKey: (item: T) => number | string
	/** Scroll container element getter for virtualization */
	getScrollElement?: () => HTMLDivElement | null
	/** Scroll margin for virtualization */
	scrollMargin?: number
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
	scrollMargin
}: LearnablePanelProps<T>) {
	const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

	const wrappedEstimateItemSize = useCallback(
		(item: T, index: number, laneWidth: number) => {
			const calculated = estimateItemSize(item, index, laneWidth)
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
							{label}
						</span>
						<CountBadge count={items.length} />
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
						/>
					</Button>
				}
			/>
			<div
				aria-hidden={isCollapsed}
				className={cn(
					'flex-1 transition-[height,opacity] duration-200',
					isCollapsed
						? 'invisible h-0 overflow-hidden py-0 opacity-0'
						: 'visible py-6 opacity-100'
				)}
			>
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
		</div>
	)
}
