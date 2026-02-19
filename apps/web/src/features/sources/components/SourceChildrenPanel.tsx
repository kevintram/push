import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DetailTabPanelState } from '~/components/DetailTabs'
import { estimateCardSize } from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { EntitySearchDialog } from '~/components/search/EntitySearchDialog'
import { AddEntityMenu } from '~/components/ui/add-entity-menu'
import type { FsrsState } from '~/models/learnable.types'
import { useAddSourceChild } from '../api/addSourceChild'
import { useSourceChildren } from '../api/getSourceChildren'
import { invalidateSourceDetailQueries, sourceKeys } from '../api/queryKeys'
import type { Source } from '../types/source.types'
import { AddSourceDialog } from './AddSourceDialog'
import { SourceActionMenu } from './SourceActionMenu'
import { SourceCard } from './SourceCard'

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
	inheritFsrsState?: FsrsState | null
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
	inheritFsrsState,
	getScrollElement,
	scrollMargin,
	onChildSelect,
	onChildCreated,
	renderCard
}: SourceChildrenPanelProps) {
	const queryClient = useQueryClient()
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
	const addSourceChild = useAddSourceChild()
	const childrenQuery = useSourceChildren(sourceId, {
		enabled: childrenProp === undefined
	})

	const inherit = inheritFsrsState ? { fsrsState: inheritFsrsState } : undefined

	const handleChildCreated = useCallback(
		(newSourceId: number) => {
			if (sourceId !== undefined) {
				void invalidateSourceDetailQueries(queryClient, sourceId)
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

	const children = childrenProp ?? childrenQuery.data ?? []
	const isLoading = childrenProp === undefined && childrenQuery.isPending
	const isError = childrenProp === undefined && childrenQuery.isError

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

	const items = useMemo<Array<ListItem>>(
		() => children.map(child => ({ type: 'child' as const, child })),
		[children]
	)

	const estimateItemSize = useCallback(
		(item: ListItem, _index: number, laneWidth: number) =>
			estimateCardSize(
				item.child.title ?? '',
				item.child.notes ?? '',
				laneWidth
			),
		[]
	)

	const renderItem = useCallback(
		(item: ListItem) => {
			const handleRemoveRelationship = () => {
				toast.info('Remove child relationship not yet implemented')
			}

			const handleClick = () => {
				handleChildSelect(item.child.id)
			}

			if (renderCard) {
				return renderCard(item.child, handleRemoveRelationship, handleClick)
			}

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
		<div className='flex flex-col gap-4'>
			{sourceId !== undefined && (
				<div className='flex justify-end'>
					<AddEntityMenu
						createItems={[
							{
								label: 'Create',
								onSelect: () => setIsAddDialogOpen(true)
							}
						]}
						isLoading={addSourceChild.isPending}
						onSearch={() => setIsSearchDialogOpen(true)}
						searchLabel='Search'
					/>
				</div>
			)}

			<DetailTabPanelState
				emptyMessage='No child sources'
				error={childrenQuery.error}
				isEmpty={items.length === 0}
				isError={isError}
				isLoading={isLoading}
				isRefreshing={
					childrenProp === undefined && childrenQuery.isFetching && !isLoading
				}
				onRetry={() => {
					void childrenQuery.refetch()
				}}
			>
				<MasonryLayout
					estimateItemSize={estimateItemSize}
					gap={16}
					getItemKey={getItemKey}
					getScrollElement={getScrollElement}
					items={items}
					renderItem={renderItem}
					scrollMargin={scrollMargin}
				/>
			</DetailTabPanelState>

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

			{sourceId !== undefined && (
				<AddSourceDialog
					inherit={inherit}
					onOpenChange={setIsAddDialogOpen}
					onSuccess={handleChildCreated}
					open={isAddDialogOpen}
					relationship={{ kind: 'child', parentSourceId: sourceId }}
				/>
			)}
		</div>
	)
}
