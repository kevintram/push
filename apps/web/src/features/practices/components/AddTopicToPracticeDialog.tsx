import { SquarePen } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MIN_HEIGHT } from '~/components/search/constants'
import { SearchInput } from '~/components/search/SearchInput'
import { SearchResultsContainer } from '~/components/search/SearchResultsContainer'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { useSearchTopics } from '~/features/topics/api/searchTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'

interface AddTopicToPracticeDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	existingTopicIds: Array<number>
	onCreateNew?: (query: string) => void
	onSelected?: (topic: Topic) => void
	isCreating?: boolean
}

export function AddTopicToPracticeDialog({
	open,
	onOpenChange,
	existingTopicIds,
	onCreateNew,
	onSelected,
	isCreating = false
}: AddTopicToPracticeDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [query, setQuery] = useState('')
	const debouncedQuery = useDebouncedValue(query, 300)

	const { data: searchResults = [], isLoading } = useSearchTopics({
		query: debouncedQuery || undefined,
		enabled: open
	})

	const filteredResults = useMemo(() => {
		const existingSet = new Set(existingTopicIds)
		return searchResults.filter(topic => !existingSet.has(topic.id))
	}, [searchResults, existingTopicIds])

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

	const handleCreateTopicClick = useCallback(() => {
		onCreateNew?.(query)
		onOpenChange(false)
	}, [query, onCreateNew, onOpenChange])

	const handleTopicSelected = useCallback(
		(topic: Topic) => {
			onSelected?.(topic)
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
		(topic: Topic) => (
			<TopicCard
				headerRight={<TopicActionMenu topic={topic} />}
				minHeight={MIN_HEIGHT}
				onTopicClick={handleTopicSelected}
				searchQuery={debouncedQuery}
				topic={topic}
			/>
		),
		[handleTopicSelected, debouncedQuery]
	)

	const estimateItemSize = useCallback((topic: Topic) => {
		const nameLines = Math.ceil((topic.name?.length || 8) / 40)
		const notesLines = topic.notes
			? Math.min(2, Math.ceil(topic.notes.length / 40))
			: 0
		return Math.max(MIN_HEIGHT, 80 + (nameLines - 1) * 20 + notesLines * 20)
	}, [])

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[90vh] w-full max-w-[90vw] flex-col p-0 md:h-[600px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px]'
				showCloseButton={false}
			>
				<DialogHeader className='flex-shrink-0 px-3 pt-3 md:px-4 md:pt-4'>
					<DialogTitle className='sr-only'>Add Topic to Practice</DialogTitle>
					<div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
						<SearchInput
							inputRef={inputRef}
							onChange={handleSearchChange}
							onClear={handleClear}
							value={query}
						/>
						{onCreateNew && (
							<Button
								disabled={isCreating}
								onClick={handleCreateTopicClick}
								size='default'
								variant='secondary'
							>
								<SquarePen className='h-4 w-4' />
								Create New
							</Button>
						)}
					</div>
				</DialogHeader>

				<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-3 pt-0 md:p-4'>
					<SearchResultsContainer
						animate={false}
						estimateItemSize={estimateItemSize}
						getItemKey={topic => topic.id}
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
