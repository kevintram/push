import { SquarePen } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	MIN_HEIGHT,
	SearchInput,
	SearchResultsContainer
} from '~/components/search'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '~/components/ui/Dialog'
import { useGlobalSearch } from '~/hooks/useGlobalSearch'
import type { Topic } from '~/models/review-topic.types'
import { useCreateTopic } from '../hooks/useCreateTopic'
import { TopicCard } from './TopicCard'

interface SearchResult {
	results: Array<Topic>
	isLoading: boolean
	debouncedQuery: string
	hasQuery?: boolean
}

interface SearchOrCreateTopicDialogProps {
	open?: boolean
	onOpenChange?: (open: boolean) => void
	trigger?: ReactNode
	title: string
	topicDefaults?: Partial<Topic>
	onTopicCreated?: (topic: Topic) => Promise<void> | void
	onTopicSelected?: (topic: Topic) => Promise<void> | void
	useSearch?: (query: string) => SearchResult
	defaultQuery?: string
	onSearchQueryChange?: (query: string) => void
	renderItem?: (topic: Topic) => ReactNode
}

export function SearchOrCreateTopicDialog({
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	trigger,
	title,
	topicDefaults = {},
	onTopicCreated,
	onTopicSelected,
	useSearch,
	defaultQuery = '',
	onSearchQueryChange,
	renderItem: customRenderItem
}: SearchOrCreateTopicDialogProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState(defaultQuery)
	const [selectedIndex, setSelectedIndex] = useState(0)
	const inputRef = useRef<HTMLInputElement>(null)

	// Use controlled or uncontrolled state
	const isControlled = controlledOpen !== undefined
	const open = isControlled ? controlledOpen : uncontrolledOpen
	const setOpen = isControlled
		? controlledOnOpenChange ||
			(() => {
				// No-op function for controlled mode without onChange handler
			})
		: setUncontrolledOpen

	// Use custom search hook if provided, otherwise use default useGlobalSearch
	const defaultSearchResults = useGlobalSearch(searchQuery, open && !useSearch)

	const customSearchResults = useSearch?.(searchQuery)

	const searchResults: SearchResult = useMemo(() => {
		if (useSearch && customSearchResults) {
			return customSearchResults
		}
		return {
			results: defaultSearchResults.results,
			isLoading: defaultSearchResults.isLoading,
			debouncedQuery: defaultSearchResults.debouncedQuery,
			hasQuery: defaultSearchResults.hasQuery
		}
	}, [
		useSearch,
		customSearchResults,
		defaultSearchResults.results,
		defaultSearchResults.isLoading,
		defaultSearchResults.debouncedQuery,
		defaultSearchResults.hasQuery
	])

	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()

	// Focus search input when dialog opens
	useEffect(() => {
		if (open) {
			setTimeout(() => {
				inputRef.current?.focus()
			}, 0)
		} else {
			setSelectedIndex(0)
		}
	}, [open])

	// Reset search query when dialog opens/closes
	useEffect(() => {
		if (open) {
			setSearchQuery(defaultQuery)
		}
	}, [open, defaultQuery])

	// Sync search query to parent when useSearch is provided
	useEffect(() => {
		if (useSearch && onSearchQueryChange) {
			onSearchQueryChange(searchQuery)
		}
	}, [searchQuery, useSearch, onSearchQueryChange])

	// Reset selected index when query changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally want this to run when searchQuery changes
	useEffect(() => {
		setSelectedIndex(0)
	}, [searchQuery])

	const handleTopicSelect = useCallback(
		async (topic: Topic) => {
			// Call onTopicSelected callback
			if (onTopicSelected) {
				await onTopicSelected(topic)
			}

			// Close the dialog
			setOpen(false)
		},
		[onTopicSelected, setOpen]
	)

	const handleCreateTopic = useCallback(async () => {
		try {
			const trimmedQuery = searchQuery.trim()

			const newTopic = await createTopicAsync({
				notes: trimmedQuery || '',
				...topicDefaults
			})

			// Call onTopicCreated callback
			if (onTopicCreated) {
				await onTopicCreated(newTopic)
			}

			// Close the dialog
			setOpen(false)
		} catch (_error) {
			// Error handling could be added here if needed
		}
	}, [searchQuery, topicDefaults, createTopicAsync, onTopicCreated, setOpen])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (!searchResults.hasQuery || searchResults.results.length === 0) return

			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setSelectedIndex(prev =>
					prev < searchResults.results.length - 1 ? prev + 1 : 0
				)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setSelectedIndex(prev =>
					prev > 0 ? prev - 1 : searchResults.results.length - 1
				)
			} else if (e.key === 'Enter') {
				e.preventDefault()
				if (searchResults.results[selectedIndex]) {
					handleTopicSelect(searchResults.results[selectedIndex])
				}
			} else if (e.key === 'Escape') {
				setOpen(false)
			}
		},
		[
			searchResults.hasQuery,
			searchResults.results,
			selectedIndex,
			handleTopicSelect,
			setOpen
		]
	)

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value)
		},
		[]
	)

	const handleClear = useCallback(() => {
		setSearchQuery('')
	}, [])

	const renderItem = useCallback(
		(topic: Topic) => {
			// Use custom renderItem if provided, otherwise use default TopicCard
			if (customRenderItem) {
				return customRenderItem(topic)
			}

			return (
				<TopicCard
					minHeight={MIN_HEIGHT}
					onTopicClick={handleTopicSelect}
					reviews={topic.reviews ?? []}
					searchQuery={searchResults.debouncedQuery}
					topic={topic}
				/>
			)
		},
		[customRenderItem, handleTopicSelect, searchResults.debouncedQuery]
	)

	const dialogContent = (
		<DialogContent
			className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[600px] w-full min-w-5xl flex-col p-0'
			showCloseButton={false}
		>
			<DialogHeader className='flex-shrink-0 px-4 pt-4'>
				<DialogTitle className='sr-only'>{title}</DialogTitle>
				<div className='flex items-center gap-4'>
					<SearchInput
						inputRef={inputRef}
						onChange={handleSearchChange}
						onClear={handleClear}
						onKeyDown={handleKeyDown}
						value={searchQuery}
					/>
					<Button
						disabled={isCreatingTopic}
						onClick={handleCreateTopic}
						size='default'
						variant='secondary'
					>
						<SquarePen className='h-4 w-4' />
						Create New
					</Button>
				</div>
			</DialogHeader>

			<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-4 pt-0'>
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
					getItemKey={topic => topic.id}
					hasQuery={searchResults.hasQuery ?? false}
					isLoading={searchResults.isLoading}
					renderItem={renderItem}
					results={searchResults.results}
					searchQuery={searchQuery}
				/>
			</div>
		</DialogContent>
	)

	const dialogWithTrigger = trigger ? (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild={true}>{trigger}</DialogTrigger>
			{dialogContent}
		</Dialog>
	) : (
		<Dialog onOpenChange={setOpen} open={open}>
			{dialogContent}
		</Dialog>
	)

	return dialogWithTrigger
}
