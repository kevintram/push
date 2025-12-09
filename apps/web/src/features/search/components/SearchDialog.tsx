import { useNavigate } from '@tanstack/react-router'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState
} from 'react'
import { MIN_HEIGHT } from '~/components/search/constants'
import { SearchInput } from '~/components/search/SearchInput'
import { SearchResultsContainer } from '~/components/search/SearchResultsContainer'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { useSearchTopics } from '~/features/topics/api/searchTopics'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/features/topics/types/topic.types'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'

interface SearchDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	query: string
	setQuery: (query: string) => void
}

export function SearchDialog({
	open,
	onOpenChange,
	query,
	setQuery
}: SearchDialogProps) {
	const navigate = useNavigate()
	const inputRef = useRef<HTMLInputElement>(null)
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [gap, setGap] = useState(12)

	const debouncedQuery = useDebouncedValue(query, 300)
	const trimmedQuery = debouncedQuery.trim()
	const hasQuery = trimmedQuery.length > 0

	const { data: results = [], isLoading } = useSearchTopics({
		query: trimmedQuery || undefined,
		limit: 10,
		enabled: open
	})

	useEffect(() => {
		if (open) {
			setTimeout(() => {
				inputRef.current?.focus()
			}, 0)
		} else {
			setSelectedIndex(0)
		}
	}, [open])

	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally want this to run when query changes
	useEffect(() => {
		setSelectedIndex(0)
	}, [query])

	useLayoutEffect(() => {
		const updateGap = () => {
			setGap(window.innerWidth < 640 ? 8 : 12)
		}
		updateGap()
		window.addEventListener('resize', updateGap)
		return () => window.removeEventListener('resize', updateGap)
	}, [])

	const handleTopicSelect = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: topic.id.toString() }
			})
			onOpenChange(false)
		},
		[navigate, onOpenChange]
	)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (!hasQuery || results.length === 0) return

			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
			} else if (e.key === 'Enter') {
				e.preventDefault()
				if (results[selectedIndex]) {
					handleTopicSelect(results[selectedIndex])
				}
			} else if (e.key === 'Escape') {
				onOpenChange(false)
			}
		},
		[hasQuery, results, selectedIndex, handleTopicSelect, onOpenChange]
	)

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setQuery(e.target.value)
		},
		[setQuery]
	)

	const handleClear = useCallback(() => {
		setQuery('')
	}, [setQuery])

	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				minHeight={MIN_HEIGHT}
				onTopicClick={handleTopicSelect}
				searchQuery={debouncedQuery}
				topic={topic}
			/>
		),
		[handleTopicSelect, debouncedQuery]
	)

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 fixed top-0 left-1/2 w-full translate-y-0 p-0 md:max-w-2xl lg:max-w-4xl xl:max-w-5xl'
				showCloseButton={false}
			>
				<DialogHeader className='px-2 pt-2 pb-0 sm:px-4'>
					<DialogTitle className='sr-only'>Search topics</DialogTitle>
					<SearchInput
						inputClassName='px-8 text-base sm:px-10 sm:text-lg'
						inputRef={inputRef}
						onChange={handleSearchChange}
						onClear={handleClear}
						onKeyDown={handleKeyDown}
						value={query}
					/>
				</DialogHeader>

				<div className='scrollbar-track-transparent max-h-192 min-h-80 overflow-y-auto p-2 pt-0 sm:p-4'>
					<SearchResultsContainer
						animate={false}
						estimateItemSize={topic => {
							const nameLines = Math.ceil((topic.name?.length || 8) / 40)
							const notesLines = topic.notes
								? Math.min(2, Math.ceil(topic.notes.length / 40))
								: 0
							return Math.max(
								MIN_HEIGHT,
								80 + (nameLines - 1) * 20 + notesLines * 20
							)
						}}
						gap={gap}
						getItemKey={topic => topic.id}
						hasQuery={hasQuery}
						isLoading={isLoading}
						renderItem={renderItem}
						results={results}
						searchQuery={query}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
