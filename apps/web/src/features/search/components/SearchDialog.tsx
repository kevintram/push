import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MIN_HEIGHT } from '~/components/search/constants'
import { SearchInput } from '~/components/search/SearchInput'
import { SearchResultsContainer } from '~/components/search/SearchResultsContainer'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { useSearchAll } from '~/features/search/api/searchAll'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'

interface SearchDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	query: string
	setQuery: (query: string) => void
	onSelectEntity?: (entity: EntityItem) => void
}

export function SearchDialog({
	open,
	onOpenChange,
	query,
	setQuery,
	onSelectEntity
}: SearchDialogProps) {
	const navigateToEntity = useEntityNavigation()
	const inputRef = useRef<HTMLInputElement>(null)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')
	const [gap, setGap] = useState(12)

	const debouncedQuery = useDebouncedValue(query, 300)
	const trimmedQuery = debouncedQuery.trim()
	const hasQuery = trimmedQuery.length > 0

	const { data: searchResults = [], isLoading } = useSearchAll(
		{
			query: trimmedQuery || undefined,
			limit: 10,
			entityTypes: activeFilter === 'all' ? undefined : activeFilter
		},
		{ enabled: open }
	)

	const results = useMemo<Array<EntityItem>>(() => {
		return searchResults.map((result): EntityItem => {
			switch (result.entity_type) {
				case 'topic':
					return { type: 'topic', item: result.topic }
				case 'source':
					return { type: 'source', item: result.source }
				case 'practice':
					return { type: 'practice', item: result.practice }
				default: {
					const _exhaustiveCheck: never = result
					return _exhaustiveCheck
				}
			}
		})
	}, [searchResults])

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

	const handleEntitySelect = useCallback(
		(entity: EntityItem) => {
			if (onSelectEntity) {
				onSelectEntity(entity)
				onOpenChange(false)
				return
			}
			navigateToEntity(entity)
			onOpenChange(false)
		},
		[navigateToEntity, onOpenChange, onSelectEntity]
	)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
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
					handleEntitySelect(results[selectedIndex])
				}
			} else if (e.key === 'Escape') {
				onOpenChange(false)
			}
		},
		[results, selectedIndex, handleEntitySelect, onOpenChange]
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
		(entity: EntityItem) => {
			let headerRight: React.ReactNode
			switch (entity.type) {
				case 'topic':
					headerRight = <TopicActionMenu topic={entity.item} />
					break
				case 'source':
					headerRight = <SourceActionMenu source={entity.item} />
					break
				case 'practice':
					headerRight = <PracticeActionMenu practice={entity.item} />
					break
			}
			return (
				<EntityCard
					entity={entity}
					headerRight={headerRight}
					minHeight={MIN_HEIGHT}
					onEntityClick={handleEntitySelect}
					searchQuery={debouncedQuery}
				/>
			)
		},
		[handleEntitySelect, debouncedQuery]
	)

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 translate-y-0 fixed top-[15%] left-1/2 flex max-h-[66vh] w-full flex-col p-0 md:max-w-2xl lg:max-w-4xl xl:max-w-5xl'
				showCloseButton={false}
			>
				<DialogHeader className='space-y-2 px-5 pt-5 pb-1 sm:px-6'>
					<DialogTitle className='sr-only'>Search</DialogTitle>
					<SearchInput
						inputClassName='px-8 text-base sm:px-10 sm:text-lg'
						inputRef={inputRef}
						onChange={handleSearchChange}
						onClear={handleClear}
						onKeyDown={handleKeyDown}
						placeholder='Search...'
						value={query}
					/>
					<EntityTypeFilter
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
					/>
				</DialogHeader>

				<div
					className='scrollbar-track-transparent max-h-192 min-h-80 flex-1 overflow-y-auto p-2 pt-0 sm:p-4'
					ref={scrollContainerRef}
				>
					<SearchResultsContainer
						animate={false}
						estimateItemSize={estimateEntitySize}
						gap={gap}
						getItemKey={getEntityKey}
						getScrollElement={getScrollElement}
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
