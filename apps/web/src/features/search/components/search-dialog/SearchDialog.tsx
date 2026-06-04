import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import {
	type EntityType,
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { ReviewCard } from '~/features/review-cards/components/ReviewCard'
import { getReviewCardDisplayTitle } from '~/features/review-cards/utils/reviewCardCopy'
import { useSearchAll } from '~/features/search/api/searchAll'
import type { SearchResultItem } from '~/features/search/types/search.types'
import { TopicCard } from '~/features/topics/components/TopicCard'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import { estimateCardSize } from '~/utils/estimateCardSize'
import { SearchInput } from './SearchInput'
import { SearchResultsContainer } from './SearchResultsContainer'

interface SearchDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	query: string
	setQuery: (query: string) => void
	onSelectEntity?: (entity: SearchResultItem) => void | Promise<void>
	onCreate?: () => void | Promise<void>
	allowedTypes?: Array<EntityType>
	initialFilter?: EntityTypeFilterValue
	closeOnSelect?: boolean
	title?: string
	placeholder?: string
	createLabel?: string
	isCreating?: boolean
	filterResult?: (result: SearchResultItem) => boolean
	showAllOption?: boolean
	showNoTagOption?: boolean
}

function toEntityTypes(filter: EntityTypeFilterValue): string | undefined {
	if (filter === 'all') return
	if (filter === 'topic') return 'topic'
	if (filter === 'practice') return 'practice'
	return 'flashcard'
}

function matchesFilter(
	result: SearchResultItem,
	filter: EntityTypeFilterValue
): boolean {
	if (filter === 'all') return true
	if (filter === 'topic') return result.entity_type === 'topic'
	if (result.entity_type !== 'review_card' || !result.review_card) return false
	return result.review_card.type === filter
}

export function SearchDialog({
	open,
	onOpenChange,
	query,
	setQuery,
	onSelectEntity,
	onCreate,
	allowedTypes,
	initialFilter,
	closeOnSelect = true,
	title = 'Search',
	placeholder = 'Search notes...',
	createLabel = 'Create topic',
	isCreating = false,
	filterResult,
	showAllOption = true,
	showNoTagOption = false
}: SearchDialogProps) {
	const navigate = useNavigate()
	const inputRef = useRef<HTMLInputElement>(null)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])
	const [selectedIndex, setSelectedIndex] = useState(0)
	const resolvedAllowedTypes = useMemo<Array<EntityType>>(
		() => allowedTypes ?? ['topic', 'practice', 'flashcard'],
		[allowedTypes]
	)
	const resolvedInitialFilter = useMemo<EntityTypeFilterValue>(
		() =>
			initialFilter ??
			(resolvedAllowedTypes.length === 1
				? (resolvedAllowedTypes[0] ?? 'all')
				: 'all'),
		[initialFilter, resolvedAllowedTypes]
	)
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>(
		resolvedInitialFilter
	)
	const [gap, setGap] = useState(12)

	const debouncedQuery = useDebouncedValue(query, 300)
	const trimmedQuery = debouncedQuery.trim()
	const hasQuery = trimmedQuery.length > 0

	const { data: searchResults = [], isLoading } = useSearchAll(
		{
			query: trimmedQuery || undefined,
			limit: 24,
			entityTypes: toEntityTypes(activeFilter)
		},
		{ enabled: open }
	)

	const results = useMemo(() => {
		const isAllowedFilter =
			activeFilter === 'all' ||
			resolvedAllowedTypes.includes(activeFilter as EntityType)
		if (!isAllowedFilter) return []
		return searchResults.filter(result => {
			if (!matchesFilter(result, activeFilter)) return false
			return filterResult ? filterResult(result) : true
		})
	}, [searchResults, activeFilter, resolvedAllowedTypes, filterResult])

	useEffect(() => {
		if (open) {
			setActiveFilter(resolvedInitialFilter)
			setTimeout(() => inputRef.current?.focus(), 0)
		} else {
			setSelectedIndex(0)
		}
	}, [open, resolvedInitialFilter])

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset keyboard index when query changes
	useEffect(() => {
		setSelectedIndex(0)
	}, [query])

	useLayoutEffect(() => {
		const updateGap = () => setGap(window.innerWidth < 640 ? 8 : 12)
		updateGap()
		window.addEventListener('resize', updateGap)
		return () => window.removeEventListener('resize', updateGap)
	}, [])

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (results.length === 0) return

		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
		} else if (e.key === 'Enter') {
			e.preventDefault()
			if (results[selectedIndex]) {
				void handleSelect(results[selectedIndex])
			}
		} else if (e.key === 'Escape') {
			onOpenChange(false)
		}
	}

	const handleSelect = async (entity: SearchResultItem) => {
		if (onSelectEntity) {
			await onSelectEntity(entity)
			if (closeOnSelect) onOpenChange(false)
			return
		}

		if (entity.entity_type === 'topic' && entity.topic) {
			navigate({
				to: '/topics/$topicId',
				params: { topicId: entity.topic.id.toString() }
			})
		} else if (entity.entity_type === 'review_card' && entity.review_card) {
			navigate({
				to: '/review-cards/$reviewCardId',
				params: { reviewCardId: entity.review_card.id.toString() },
				search: { tab: 'home' }
			})
		}

		onOpenChange(false)
	}

	const handleCreateNew = async () => {
		if (onCreate) {
			await onCreate()
			return
		}

		onOpenChange(false)
		navigate({ to: '/library', search: { create: true } })
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='fixed top-[5%] left-1/2 flex max-h-[90vh] w-full -translate-x-1/2 translate-y-0 flex-col p-0 md:max-w-3xl lg:max-w-5xl xl:max-w-6xl'
				showCloseButton={false}
			>
				<DialogHeader className='space-y-1 px-4 pt-4 sm:px-6'>
					<DialogTitle className='sr-only'>{title}</DialogTitle>
					<div className='flex items-center gap-2'>
						<SearchInput
							inputClassName='px-8 text-base sm:px-10 sm:text-lg'
							inputRef={inputRef}
							onChange={e => setQuery(e.target.value)}
							onClear={() => setQuery('')}
							onKeyDown={handleKeyDown}
							placeholder={placeholder}
							value={query}
						/>
						<Button
							disabled={isCreating}
							onClick={() => {
								void handleCreateNew()
							}}
							variant='outline'
						>
							<Plus />
							{createLabel}
						</Button>
					</div>
					<EntityTypeFilter
						activeFilter={activeFilter}
						allowedTypes={resolvedAllowedTypes}
						onFilterChange={setActiveFilter}
						showAllOption={showAllOption}
						showNoTagOption={showNoTagOption}
					/>
				</DialogHeader>

				<div
					className='scrollbar-track-transparent min-h-80 flex-1 overflow-y-auto p-4 pt-1'
					ref={scrollContainerRef}
				>
					<SearchResultsContainer
						animate={false}
						estimateItemSize={(result, _index, laneWidth) => {
							if (result.entity_type === 'topic' && result.topic) {
								return estimateCardSize(
									result.topic.title || 'Untitled topic',
									result.topic.body || '',
									laneWidth
								)
							}
							if (result.entity_type === 'review_card' && result.review_card) {
								return estimateCardSize(
									getReviewCardDisplayTitle(result.review_card),
									result.review_card.secondary_text || '',
									laneWidth
								)
							}
							return 120
						}}
						gap={gap}
						getItemKey={result =>
							result.entity_type === 'topic'
								? `topic-${result.topic?.id ?? 'unknown'}`
								: `review-card-${result.review_card?.id ?? 'unknown'}`
						}
						getScrollElement={getScrollElement}
						hasQuery={hasQuery}
						isLoading={isLoading}
						minItemWidth={280}
						renderItem={result => {
							if (result.entity_type === 'topic' && result.topic) {
								return (
									<TopicCard
										onClick={() => {
											void handleSelect(result)
										}}
										topic={result.topic}
									/>
								)
							}

							if (result.entity_type === 'review_card' && result.review_card) {
								return (
									<ReviewCard
										onClick={() => {
											void handleSelect(result)
										}}
										reviewCard={result.review_card}
									/>
								)
							}

							return null
						}}
						results={results}
						searchQuery={trimmedQuery}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
