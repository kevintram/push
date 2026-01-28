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
import { useSearchPractices } from '~/features/practices/api/searchPractices'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { PracticeCard } from '~/features/practices/components/PracticeCard'
import type { Practice } from '~/features/practices/types/practice.types'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'

interface AddPracticeToTopicDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** Practices already linked to this topic (to filter from results) */
	existingPracticeIds?: Array<number>
	onSelected?: (practice: Practice) => void
}

export function AddPracticeToTopicDialog({
	open,
	onOpenChange,
	existingPracticeIds = [],
	onSelected
}: AddPracticeToTopicDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [query, setQuery] = useState('')
	const debouncedQuery = useDebouncedValue(query, 300)

	const { data: practiceResults = [], isLoading } = useSearchPractices(
		{ query: debouncedQuery || undefined },
		{ enabled: open }
	)

	// Filter out practices already linked to this topic
	const filteredResults = useMemo(() => {
		const existingSet = new Set(existingPracticeIds)
		return practiceResults.filter(p => !existingSet.has(p.id))
	}, [practiceResults, existingPracticeIds])

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

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setQuery(e.target.value)
		},
		[]
	)

	const handleClear = useCallback(() => {
		setQuery('')
	}, [])

	const handlePracticeSelected = useCallback(
		(practice: Practice) => {
			onSelected?.(practice)
			onOpenChange(false)
		},
		[onSelected, onOpenChange]
	)

	const renderItem = useCallback(
		(practice: Practice) => (
			<PracticeCard
				headerRight={<PracticeActionMenu practice={practice} />}
				minHeight={MIN_HEIGHT}
				onPracticeClick={() => handlePracticeSelected(practice)}
				practice={practice}
				searchQuery={debouncedQuery}
			/>
		),
		[handlePracticeSelected, debouncedQuery]
	)

	const estimateItemSize = useCallback((practice: Practice) => {
		const promptLines = Math.ceil((practice.prompt?.length || 8) / 40)
		const answerLines = practice.answer
			? Math.min(2, Math.ceil(practice.answer.length / 40))
			: 0
		return Math.max(MIN_HEIGHT, 80 + (promptLines - 1) * 20 + answerLines * 20)
	}, [])

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[90vh] w-full max-w-[90vw] flex-col p-0 md:h-[600px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px]'
				showCloseButton={false}
			>
				<DialogHeader className='flex-shrink-0 px-3 pt-3 md:px-4 md:pt-4'>
					<DialogTitle className='sr-only'>Add Practice</DialogTitle>
					<SearchInput
						inputRef={inputRef}
						onChange={handleSearchChange}
						onClear={handleClear}
						placeholder='Search practices...'
						value={query}
					/>
				</DialogHeader>

				<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-3 pt-0 md:p-4'>
					<SearchResultsContainer
						animate={false}
						estimateItemSize={estimateItemSize}
						getItemKey={(practice: Practice) => practice.id}
						hasQuery={Boolean(debouncedQuery.trim())}
						isLoading={isLoading}
						renderItem={renderItem}
						results={filteredResults}
						searchQuery={query}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
