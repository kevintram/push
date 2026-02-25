import { Check, Loader2, Plus } from 'lucide-react'
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
import { MIN_HEIGHT } from '~/components/search/constants'
import { SearchInput } from '~/components/search/SearchInput'
import { SearchResultsContainer } from '~/components/search/SearchResultsContainer'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { AddNoteDialog } from '~/features/notes/components/AddNoteDialog'
import {
	NoteCard,
	type NoteCardStatusBadge,
	toNoteCardStatusBadge
} from '~/features/notes/components/NoteCard'
import type { Note } from '~/features/notes/types/note.types'
import { orderNoteStatusBadges } from '~/features/notes/utils/orderNoteStatusBadges'
import { useSearchAll } from '~/features/search/api/searchAll'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import { useNoteNavigation } from '~/hooks/useNoteNavigation'
import { estimateCardSize } from '~/utils/estimateCardSize'

interface SearchDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	query: string
	setQuery: (query: string) => void
	onSelectEntity?: (note: Note) => void | Promise<void>
	allowedTypes?: Array<EntityType>
	initialFilter?: EntityTypeFilterValue
	addedNoteIds?: Array<number>
	pendingNoteIds?: Array<number>
	customStatusBadges?: Array<{ noteId: number; badge: NoteCardStatusBadge }>
	closeOnSelect?: boolean
	title?: string
	placeholder?: string
	showAllOption?: boolean
	showNoTagOption?: boolean
}

function matchesFilter(note: Note, filter: EntityTypeFilterValue): boolean {
	if (filter === 'all') return true
	if (filter === 'none') return note.tags.length === 0
	if (filter === 'topic') return note.tags.includes('TOPIC')
	if (filter === 'source') return note.tags.includes('SOURCE')
	return note.tags.includes('PRACTICE')
}

export function SearchDialog({
	open,
	onOpenChange,
	query,
	setQuery,
	onSelectEntity,
	allowedTypes,
	initialFilter,
	addedNoteIds = [],
	pendingNoteIds = [],
	customStatusBadges = [],
	closeOnSelect = true,
	title = 'Search',
	placeholder = 'Search notes...',
	showAllOption = true,
	showNoTagOption = true
}: SearchDialogProps) {
	const navigateToNote = useNoteNavigation()
	const inputRef = useRef<HTMLInputElement>(null)
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollContainerRef.current, [])
	const [selectedIndex, setSelectedIndex] = useState(0)
	const resolvedAllowedTypes = useMemo<Array<EntityType>>(
		() => allowedTypes ?? ['topic', 'source', 'practice'],
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
	const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)

	const handleCreateNoteSuccess = useCallback(
		async (note: Note) => {
			if (onSelectEntity) {
				await onSelectEntity(note)
				if (closeOnSelect) {
					onOpenChange(false)
				}
				return
			}
			navigateToNote(note.id)
			onOpenChange(false)
		},
		[onSelectEntity, closeOnSelect, onOpenChange, navigateToNote]
	)

	const addedNoteIdSet = useMemo(
		() => new Set<number>(addedNoteIds),
		[addedNoteIds]
	)
	const pendingNoteIdSet = useMemo(
		() => new Set<number>(pendingNoteIds),
		[pendingNoteIds]
	)
	const customStatusBadgeMap = useMemo(
		() =>
			new Map<number, NoteCardStatusBadge>(
				customStatusBadges.map(({ noteId, badge }) => [noteId, badge])
			),
		[customStatusBadges]
	)
	const addedBadge = useMemo<NoteCardStatusBadge>(
		() => ({
			label: '',
			icon: <Check className='h-3 w-3' />,
			tooltip: 'Added',
			variant: 'outline',
			className:
				'h-5 border border-emerald-300 bg-emerald-100 text-emerald-900 text-xs dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
		}),
		[]
	)
	const addingBadge = useMemo<NoteCardStatusBadge>(
		() => ({
			label: '',
			icon: <Loader2 className='h-3 w-3 animate-spin' />,
			tooltip: 'Adding...',
			variant: 'outline',
			className:
				'h-5 border border-emerald-300 bg-emerald-100 text-emerald-900 text-xs dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
		}),
		[]
	)

	const debouncedQuery = useDebouncedValue(query, 300)
	const trimmedQuery = debouncedQuery.trim()
	const hasQuery = trimmedQuery.length > 0

	const { data: searchResults = [], isLoading } = useSearchAll(
		{
			query: trimmedQuery || undefined,
			limit: 12,
			entityTypes:
				activeFilter === 'all' || activeFilter === 'none'
					? undefined
					: activeFilter
		},
		{ enabled: open }
	)

	const results = useMemo(
		() =>
			searchResults
				.map(result => result.note)
				.filter(note => matchesFilter(note, activeFilter))
				.filter(note =>
					activeFilter === 'none'
						? note.tags.length === 0
						: resolvedAllowedTypes.some(type => matchesFilter(note, type))
				),
		[searchResults, activeFilter, resolvedAllowedTypes]
	)

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

	const handleEntitySelect = (note: Note) => {
		if (onSelectEntity) {
			onSelectEntity(note)
			if (closeOnSelect) {
				onOpenChange(false)
			}
			return
		}
		navigateToNote(note.id)
		onOpenChange(false)
	}

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
				handleEntitySelect(results[selectedIndex])
			}
		} else if (e.key === 'Escape') {
			onOpenChange(false)
		}
	}
	const getStatusBadges = (
		note: Note
	): Array<NoteCardStatusBadge> | undefined => {
		let appendedBadge: NoteCardStatusBadge | null = null
		if (pendingNoteIdSet.has(note.id)) {
			appendedBadge = addingBadge
		} else {
			const customStatusBadge = customStatusBadgeMap.get(note.id)
			if (customStatusBadge) {
				appendedBadge = customStatusBadge
			} else if (addedNoteIdSet.has(note.id)) {
				appendedBadge = addedBadge
			}
		}
		if (!appendedBadge) {
			return
		}
		return [
			...orderNoteStatusBadges(note.status_badges).map(apiBadge =>
				toNoteCardStatusBadge(apiBadge)
			),
			appendedBadge
		]
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 fixed top-[5%] left-1/2 flex max-h-[90vh] w-full translate-y-0 flex-col p-0 md:max-w-3xl lg:max-w-5xl xl:max-w-6xl'
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
						<Button onClick={() => { onOpenChange(false); setIsAddNoteOpen(true); }} variant='outline'>
							<Plus className='h-4 w-4' />
							Create new
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
						estimateItemSize={(note, _index, laneWidth) =>
							estimateCardSize(
								note.title || 'Untitled note',
								note.body || '',
								laneWidth
							)
						}
						gap={gap}
						getItemKey={note => `note-${note.id}`}
						getScrollElement={getScrollElement}
						hasQuery={hasQuery}
						isLoading={isLoading}
						renderItem={note => (
							<NoteCard
								minHeight={MIN_HEIGHT}
								note={note}
								onClick={() => handleEntitySelect(note)}
								statusBadges={getStatusBadges(note)}
							/>
						)}
						results={results}
						searchQuery={query}
					/>
				</div>
			</DialogContent>
			<AddNoteDialog
				defaults={{ title: query }}
				onOpenChange={setIsAddNoteOpen}
				onSuccess={handleCreateNoteSuccess}
				open={isAddNoteOpen}
			/>
		</Dialog>
	)
}
