import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MIN_HEIGHT } from '~/components/search/constants'
import { SearchInput } from '~/components/search/SearchInput'
import { SearchResultsContainer } from '~/components/search/SearchResultsContainer'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { useSources } from '~/features/sources/api/getSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { SourceCard } from '~/features/sources/components/SourceCard'
import type { Source } from '~/features/sources/types/source.types'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'

interface AddSourceToPracticeDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	existingSourceIds: Array<number>
	onSelected?: (source: Source) => void
}

export function AddSourceToPracticeDialog({
	open,
	onOpenChange,
	existingSourceIds,
	onSelected
}: AddSourceToPracticeDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [query, setQuery] = useState('')
	const debouncedQuery = useDebouncedValue(query, 300)

	const { data: sources = [], isLoading } = useSources({}, { enabled: open })

	const filteredResults = useMemo(() => {
		const existingSet = new Set(existingSourceIds)
		let filtered = sources.filter(source => !existingSet.has(source.id))

		// Client-side text filter
		if (debouncedQuery.trim()) {
			const lowerQuery = debouncedQuery.toLowerCase()
			filtered = filtered.filter(
				source =>
					source.title?.toLowerCase().includes(lowerQuery) ||
					source.notes?.toLowerCase().includes(lowerQuery)
			)
		}

		return filtered
	}, [sources, existingSourceIds, debouncedQuery])

	useEffect(() => {
		if (open) {
			setQuery('')
		}
	}, [open])

	useEffect(() => {
		if (open) {
			requestAnimationFrame(() => {
				inputRef.current?.focus()
			})
		}
	}, [open])

	const resultsData = useMemo(
		() => ({
			results: filteredResults,
			isLoading,
			debouncedQuery,
			hasQuery: Boolean(debouncedQuery.trim())
		}),
		[filteredResults, isLoading, debouncedQuery]
	)

	const handleSourceSelected = useCallback(
		(source: Source) => {
			onSelected?.(source)
			onOpenChange(false)
		},
		[onSelected, onOpenChange]
	)

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setQuery(e.target.value)
		},
		[]
	)

	const handleClear = useCallback(() => {
		setQuery('')
	}, [])

	const renderItem = useCallback(
		(source: Source) => (
			<SourceCard
				headerRight={<SourceActionMenu source={source} />}
				minHeight={MIN_HEIGHT}
				onSourceClick={handleSourceSelected}
				searchQuery={debouncedQuery}
				source={source}
			/>
		),
		[handleSourceSelected, debouncedQuery]
	)

	const estimateItemSize = useCallback((source: Source) => {
		const titleLines = Math.ceil((source.title?.length || 8) / 40)
		const notesLines = source.notes
			? Math.min(2, Math.ceil(source.notes.length / 40))
			: 0
		return Math.max(MIN_HEIGHT, 80 + (titleLines - 1) * 20 + notesLines * 20)
	}, [])

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[90vh] w-full max-w-[90vw] flex-col p-0 md:h-[600px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px]'
				showCloseButton={false}
			>
				<DialogHeader className='flex-shrink-0 px-3 pt-3 md:px-4 md:pt-4'>
					<DialogTitle className='sr-only'>Add Source to Practice</DialogTitle>
					<SearchInput
						inputRef={inputRef}
						onChange={handleSearchChange}
						onClear={handleClear}
						value={query}
					/>
				</DialogHeader>

				<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-3 pt-0 md:p-4'>
					<SearchResultsContainer
						animate={false}
						estimateItemSize={estimateItemSize}
						getItemKey={source => source.id}
						hasQuery={resultsData.hasQuery}
						isLoading={resultsData.isLoading}
						renderItem={renderItem}
						results={resultsData.results}
						searchQuery={query}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
