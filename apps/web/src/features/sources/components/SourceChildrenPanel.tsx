import { useQueryClient } from '@tanstack/react-query'
import { Baby, ChevronDown } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/AddEntityMenu'
import { Button } from '~/components/ui/Button'
import { TopicPanelHeader } from '~/components/ui/TopicPanelHeader'
import { useAddSourceChild } from '../api/addSourceChild'
import { sourceKeys } from '../api/queryKeys'
import type { Source } from '../types/source.types'
import {
	AddSourceDialog,
	type AddSourceDialogContext,
	type SrsSource
} from './AddSourceDialog'
import { SourceActionMenu } from './SourceActionMenu'
import { SourceCard } from './SourceCard'

const MIN_WIDTH = 280
const MIN_HEIGHT = 96

type ListItem = { type: 'child'; child: Source }

interface SourceChildrenPanelProps {
	sourceId: number | undefined
	/**
	 * Children sources from the single getSource fetch.
	 * When provided, the panel uses this directly instead of making a separate API call.
	 */
	children?: Array<Source>
	/**
	 * Parent source's SRS data for inheritance when creating children.
	 */
	parentSrsSource?: SrsSource | null
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
	/**
	 * Called when a child is selected/clicked.
	 */
	onChildSelect?: (sourceId: number) => void
	/**
	 * Called when a new child source is created.
	 */
	onChildCreated?: (sourceId: number) => void
	/**
	 * Custom card renderer. If not provided, uses default SourceCard.
	 * @param source - The child source to render
	 * @param onRemove - Callback to remove the relationship
	 * @param onClick - Callback when the card is clicked
	 */
	renderCard?: (
		source: Source,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function SourceChildrenPanel({
	sourceId,
	children: childrenProp,
	parentSrsSource,
	getScrollElement,
	scrollMargin,
	onChildSelect,
	onChildCreated,
	renderCard
}: SourceChildrenPanelProps) {
	const queryClient = useQueryClient()
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
	const addSourceChild = useAddSourceChild()

	// Build dialog context for creating a child source
	const addDialogContext: AddSourceDialogContext | undefined = useMemo(() => {
		if (sourceId === undefined) return
		return {
			type: 'child',
			parentSourceId: sourceId,
			srsSource: parentSrsSource
		}
	}, [sourceId, parentSrsSource])

	const handleChildCreated = useCallback(
		(newSourceId: number) => {
			// Invalidate the parent source to refresh children list
			if (sourceId !== undefined) {
				queryClient.invalidateQueries({ queryKey: sourceKeys.detail(sourceId) })
			}
			onChildCreated?.(newSourceId)
		},
		[queryClient, sourceId, onChildCreated]
	)

	const handleExistingChildSelected = useCallback(
		(child: Source) => {
			if (sourceId === undefined) return
			addSourceChild.mutate({
				parentId: sourceId,
				data: { child_id: child.id }
			})
		},
		[sourceId, addSourceChild]
	)

	// Use prop directly - children comes from the single getSource fetch
	const children = childrenProp ?? []

	// Determine navigation behavior
	const handleChildSelect = useCallback(
		(childSourceId: number) => {
			onChildSelect?.(childSourceId)
		},
		[onChildSelect]
	)

	const handleSourceUpdateSuccess = useCallback(
		(updatedSource: Source) => {
			queryClient.setQueryData(
				sourceKeys.children(sourceId!),
				(old: Array<Source>) => {
					return (
						old?.map(child => {
							if (child.id === updatedSource.id) {
								return updatedSource
							}
							return child
						}) ?? []
					)
				}
			)
		},
		[queryClient, sourceId]
	)

	// Map children into array
	const items = useMemo<Array<ListItem>>(
		() => children.map(child => ({ type: 'child' as const, child })),
		[children]
	)

	const estimateItemSize = useCallback((item: ListItem) => {
		// Estimate height based on source title and notes length
		const { child } = item
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const titleHeight =
			Math.floor((child.title?.length ?? 0) / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor((child.notes?.length ?? 0) / numCharsPerLine) * lineHeight

		const calculatedHeight = baseHeight + titleHeight + newLine + notesHeight

		return Math.max(calculatedHeight, MIN_HEIGHT)
	}, [])

	const renderItem = useCallback(
		(item: ListItem) => {
			const handleRemoveRelationship = () => {
				// For now, removing parent-child is not implemented
				// This would require an API endpoint to remove the relationship
				toast.info('Remove child relationship not yet implemented')
			}

			const handleClick = () => {
				handleChildSelect(item.child.id)
			}

			// Use custom renderer if provided
			if (renderCard) {
				return renderCard(item.child, handleRemoveRelationship, handleClick)
			}

			// Default card rendering
			return (
				<SourceCard
					headerRight={
						<SourceActionMenu
							onRemoveRelationship={handleRemoveRelationship}
							onSourceUpdateSuccess={handleSourceUpdateSuccess}
							removeRelationshipText='Remove as Child'
							source={item.child}
						/>
					}
					minHeight={MIN_HEIGHT}
					onSourceClick={() => handleClick()}
					source={item.child}
				/>
			)
		},
		[handleChildSelect, renderCard, handleSourceUpdateSuccess]
	)

	const getItemKey = useCallback((item: ListItem, _index: number) => {
		return item.child.id
	}, [])

	return (
		<div className='flex flex-col'>
			<TopicPanelHeader
				actions={
					<AddEntityMenu
						createItems={[
							{
								label: 'Create Source',
								onSelect: () => setIsAddDialogOpen(true)
							}
						]}
						isLoading={addSourceChild.isPending}
						onSearch={() => setIsSearchDialogOpen(true)}
						searchLabel='Search Sources'
					/>
				}
				label={
					<Button
						className='flex items-center gap-2 p-0'
						onClick={() => setIsCollapsed(!isCollapsed)}
						variant='ghost'
					>
						<Baby className='h-4 w-4' />
						<span className='font-medium text-muted-foreground text-sm'>
							Child sources ({children.length})
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

			{sourceId !== undefined && (
				<EntitySearchDialog
					defaultType='source'
					entityTypes={['source']}
					existingIds={{
						source: children.map(child => child.id)
					}}
					onOpenChange={setIsSearchDialogOpen}
					onSelected={(_type, source) =>
						handleExistingChildSelected(source as Source)
					}
					open={isSearchDialogOpen}
					sourceSearchParams={{
						addableAsChildTo: sourceId
					}}
					title='Search child sources'
				/>
			)}

			{/* Add Child Source Dialog */}
			{addDialogContext && (
				<AddSourceDialog
					context={addDialogContext}
					onOpenChange={setIsAddDialogOpen}
					onSuccess={handleChildCreated}
					open={isAddDialogOpen}
				/>
			)}
		</div>
	)
}
