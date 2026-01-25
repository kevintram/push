import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, FileText, Loader2, Plus, Search } from 'lucide-react'
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
import { useAddPracticeSource } from '../api/addPracticeSource'
import { practiceKeys } from '../api/queryKeys'
import { useRemovePracticeSource } from '../api/removePracticeSource'
import { AddSourceToPracticeDialog } from './AddSourceToPracticeDialog'

const MIN_HEIGHT = 96

interface PracticeSourcesPanelProps {
	practiceId: number | undefined
	sources?: Array<Source>
	getScrollElement?: () => HTMLDivElement | null
	scrollMargin?: number
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
	onSourceSelect,
	renderCard
}: PracticeSourcesPanelProps) {
	const queryClient = useQueryClient()
	const [showSearchDialog, setShowSearchDialog] = useState(false)

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
					<DropdownMenuItem onClick={() => setShowSearchDialog(true)}>
						<Search className='h-4 w-4' />
						Search
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AddSourceToPracticeDialog
				existingSourceIds={existingSourceIds}
				onOpenChange={setShowSearchDialog}
				onSelected={handleAdd}
				open={showSearchDialog}
			/>
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
