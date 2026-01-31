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
import { useSearchPractices } from '~/features/practices/api/searchPractices'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { PracticeCard } from '~/features/practices/components/PracticeCard'
import type { Practice } from '~/features/practices/types/practice.types'
import { useSearchSources } from '~/features/sources/api/searchSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { SourceCard } from '~/features/sources/components/SourceCard'
import type { Source } from '~/features/sources/types/source.types'
import { useSearchTopics } from '~/features/topics/api/searchTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { SearchTopicsParams } from '~/features/topics/types/api.types'
import type { Topic } from '~/features/topics/types/topic.types'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import { cn } from '~/lib/utils'

type EntityType = 'topic' | 'source' | 'practice'

type EntitySearchDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	entityTypes: Array<EntityType>
	defaultType?: EntityType
	onSelected: (
		entityType: EntityType,
		entity: Topic | Source | Practice
	) => void
	existingIds?: Partial<Record<EntityType, Array<number>>>
	excludeIds?: Partial<Record<EntityType, Array<number>>>
	topicSearchParams?: Omit<SearchTopicsParams, 'query'>
	sourceSearchParams?: { addableAsParentTo?: number; addableAsChildTo?: number }
	practiceSearchParams?: { limit?: number }
	title?: string
}

const ENTITY_LABELS: Record<EntityType, string> = {
	topic: 'Topics',
	source: 'Sources',
	practice: 'Practices'
}

export function EntitySearchDialog({
	open,
	onOpenChange,
	entityTypes,
	defaultType,
	onSelected,
	existingIds,
	excludeIds,
	topicSearchParams,
	sourceSearchParams,
	practiceSearchParams,
	title = 'Search'
}: EntitySearchDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [query, setQuery] = useState('')
	const initialType: EntityType =
		defaultType && entityTypes.includes(defaultType)
			? defaultType
			: (entityTypes[0] ?? 'topic')
	const [searchType, setSearchType] = useState<EntityType>(initialType)
	const debouncedQuery = useDebouncedValue(query, 300)

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

	useEffect(() => {
		if (defaultType && entityTypes.includes(defaultType)) {
			setSearchType(defaultType)
		}
	}, [defaultType, entityTypes])

	const topicParams = useMemo(
		() => ({
			...topicSearchParams,
			query: debouncedQuery || undefined,
			enabled: open && searchType === 'topic'
		}),
		[topicSearchParams, debouncedQuery, open, searchType]
	)

	const sourceParams = useMemo(
		() => ({
			...sourceSearchParams,
			query: debouncedQuery || undefined,
			enabled: open && searchType === 'source'
		}),
		[sourceSearchParams, debouncedQuery, open, searchType]
	)

	const practiceParams = useMemo(
		() => ({
			...practiceSearchParams,
			query: debouncedQuery || undefined,
			enabled: open && searchType === 'practice'
		}),
		[practiceSearchParams, debouncedQuery, open, searchType]
	)

	const { data: topicResults = [], isLoading: isLoadingTopics } =
		useSearchTopics(topicParams)
	const { data: sourceResults = [], isLoading: isLoadingSources } =
		useSearchSources(sourceParams)
	const { data: practiceResults = [], isLoading: isLoadingPractices } =
		useSearchPractices(practiceParams, {
			enabled: practiceParams.enabled
		})

	const filteredTopicResults = useMemo(() => {
		const existing = new Set(existingIds?.topic ?? [])
		const excluded = new Set(excludeIds?.topic ?? [])
		return topicResults.filter(t => !(existing.has(t.id) || excluded.has(t.id)))
	}, [topicResults, existingIds, excludeIds])

	const filteredSourceResults = useMemo(() => {
		const existing = new Set(existingIds?.source ?? [])
		const excluded = new Set(excludeIds?.source ?? [])
		return sourceResults.filter(
			s => !(existing.has(s.id) || excluded.has(s.id))
		)
	}, [sourceResults, existingIds, excludeIds])

	const filteredPracticeResults = useMemo(() => {
		const existing = new Set(existingIds?.practice ?? [])
		const excluded = new Set(excludeIds?.practice ?? [])
		return practiceResults.filter(
			p => !(existing.has(p.id) || excluded.has(p.id))
		)
	}, [practiceResults, existingIds, excludeIds])

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setQuery(e.target.value)
		},
		[]
	)

	const handleClear = useCallback(() => {
		setQuery('')
	}, [])

	const handleSelect = useCallback(
		(type: EntityType, entity: Topic | Source | Practice) => {
			onSelected(type, entity)
			onOpenChange(false)
		},
		[onOpenChange, onSelected]
	)

	const renderTopicItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				headerRight={<TopicActionMenu topic={topic} />}
				minHeight={MIN_HEIGHT}
				onTopicClick={() => handleSelect('topic', topic)}
				searchQuery={debouncedQuery}
				topic={topic}
			/>
		),
		[handleSelect, debouncedQuery]
	)

	const renderSourceItem = useCallback(
		(source: Source) => (
			<SourceCard
				headerRight={<SourceActionMenu source={source} />}
				minHeight={MIN_HEIGHT}
				onSourceClick={() => handleSelect('source', source)}
				searchQuery={debouncedQuery}
				source={source}
			/>
		),
		[handleSelect, debouncedQuery]
	)

	const renderPracticeItem = useCallback(
		(practice: Practice) => (
			<PracticeCard
				headerRight={<PracticeActionMenu practice={practice} />}
				minHeight={MIN_HEIGHT}
				onPracticeClick={() => handleSelect('practice', practice)}
				practice={practice}
				searchQuery={debouncedQuery}
			/>
		),
		[handleSelect, debouncedQuery]
	)

	const estimateTopicSize = useCallback((topic: Topic) => {
		const nameLines = Math.ceil((topic.name?.length || 8) / 40)
		const notesLines = topic.notes
			? Math.min(2, Math.ceil(topic.notes.length / 40))
			: 0
		return Math.max(MIN_HEIGHT, 80 + (nameLines - 1) * 20 + notesLines * 20)
	}, [])

	const estimateSourceSize = useCallback((source: Source) => {
		const titleLines = Math.ceil((source.title?.length || 8) / 40)
		const notesLines = source.notes
			? Math.min(2, Math.ceil(source.notes.length / 40))
			: 0
		return Math.max(MIN_HEIGHT, 80 + (titleLines - 1) * 20 + notesLines * 20)
	}, [])

	const estimatePracticeSize = useCallback((practice: Practice) => {
		const promptLines = Math.ceil((practice.prompt?.length || 8) / 40)
		const answerLines = practice.answer
			? Math.min(2, Math.ceil(practice.answer.length / 40))
			: 0
		return Math.max(MIN_HEIGHT, 80 + (promptLines - 1) * 20 + answerLines * 20)
	}, [])

	const resultsByType: Record<
		EntityType,
		Array<Topic> | Array<Source> | Array<Practice>
	> = {
		topic: filteredTopicResults,
		source: filteredSourceResults,
		practice: filteredPracticeResults
	}
	const isLoadingByType: Record<EntityType, boolean> = {
		topic: isLoadingTopics,
		source: isLoadingSources,
		practice: isLoadingPractices
	}
	const results = resultsByType[searchType]
	const isLoading = isLoadingByType[searchType]

	const hasMultipleTypes = entityTypes.length > 1

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[90vh] w-full max-w-[90vw] flex-col p-0 md:h-[600px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px]'
				showCloseButton={false}
			>
				<DialogHeader className='flex-shrink-0 px-3 pt-3 md:px-4 md:pt-4'>
					<DialogTitle className='sr-only'>{title}</DialogTitle>
					<div className='flex flex-col gap-3'>
						{hasMultipleTypes && (
							<div className='flex gap-1'>
								{entityTypes.map(type => (
									<Button
										className={cn(
											'flex-1',
											searchType === type && 'bg-accent text-accent-foreground'
										)}
										key={type}
										onClick={() => setSearchType(type)}
										size='sm'
										variant={searchType === type ? 'secondary' : 'ghost'}
									>
										{ENTITY_LABELS[type]}
									</Button>
								))}
							</div>
						)}
						<SearchInput
							inputRef={inputRef}
							onChange={handleSearchChange}
							onClear={handleClear}
							placeholder={`Search ${ENTITY_LABELS[searchType].toLowerCase()}...`}
							value={query}
						/>
					</div>
				</DialogHeader>

				<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-3 pt-0 md:p-4'>
					{searchType === 'topic' && (
						<SearchResultsContainer
							animate={false}
							estimateItemSize={estimateTopicSize}
							getItemKey={(topic: Topic) => topic.id}
							hasQuery={Boolean(debouncedQuery.trim())}
							isLoading={isLoading}
							renderItem={renderTopicItem}
							results={results as Array<Topic>}
							searchQuery={query}
						/>
					)}
					{searchType === 'source' && (
						<SearchResultsContainer
							animate={false}
							estimateItemSize={estimateSourceSize}
							getItemKey={(source: Source) => source.id}
							hasQuery={Boolean(debouncedQuery.trim())}
							isLoading={isLoading}
							renderItem={renderSourceItem}
							results={results as Array<Source>}
							searchQuery={query}
						/>
					)}
					{searchType === 'practice' && (
						<SearchResultsContainer
							animate={false}
							estimateItemSize={estimatePracticeSize}
							getItemKey={(practice: Practice) => practice.id}
							hasQuery={Boolean(debouncedQuery.trim())}
							isLoading={isLoading}
							renderItem={renderPracticeItem}
							results={results as Array<Practice>}
							searchQuery={query}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
