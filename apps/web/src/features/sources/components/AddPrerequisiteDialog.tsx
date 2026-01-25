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
import { cn } from '~/lib/utils'
import { EntityType } from '~/models/entity-relations.types'
import { useSearchSources } from '../api/searchSources'
import type { Source } from '../types/source.types'
import { SourceActionMenu } from './SourceActionMenu'
import { SourceCard } from './SourceCard'

interface AddPrerequisiteDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	sourceId: number | undefined
	onSelected?: (entityType: EntityType, entityId: number) => void
	isAdding?: boolean
}

export function AddPrerequisiteDialog({
	open,
	onOpenChange,
	sourceId,
	onSelected
}: AddPrerequisiteDialogProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [query, setQuery] = useState('')
	const [searchType, setSearchType] = useState<'topic' | 'source'>('topic')
	const debouncedQuery = useDebouncedValue(query, 300)

	// Search topics
	const { data: topicResults = [], isLoading: isLoadingTopics } =
		useSearchTopics({
			query: debouncedQuery || undefined,
			enabled: open && searchType === 'topic'
		})

	// Search sources (excluding self)
	const { data: sourceResults = [], isLoading: isLoadingSources } =
		useSearchSources({
			query: debouncedQuery || undefined,
			enabled: open && searchType === 'source'
		})

	// Filter out the current source from results
	const filteredSourceResults = useMemo(
		() => sourceResults.filter(s => s.id !== sourceId),
		[sourceResults, sourceId]
	)

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

	const handleTopicSelected = useCallback(
		(topic: Topic) => {
			onSelected?.(EntityType.Topic, topic.id)
			onOpenChange(false)
		},
		[onSelected, onOpenChange]
	)

	const handleSourceSelected = useCallback(
		(source: Source) => {
			onSelected?.(EntityType.Source, source.id)
			onOpenChange(false)
		},
		[onSelected, onOpenChange]
	)

	const renderTopicItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				headerRight={<TopicActionMenu topic={topic} />}
				minHeight={MIN_HEIGHT}
				onTopicClick={() => handleTopicSelected(topic)}
				searchQuery={debouncedQuery}
				topic={topic}
			/>
		),
		[handleTopicSelected, debouncedQuery]
	)

	const renderSourceItem = useCallback(
		(source: Source) => (
			<SourceCard
				headerRight={<SourceActionMenu source={source} />}
				minHeight={MIN_HEIGHT}
				onSourceClick={() => handleSourceSelected(source)}
				searchQuery={debouncedQuery}
				source={source}
			/>
		),
		[handleSourceSelected, debouncedQuery]
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

	const results = searchType === 'topic' ? topicResults : filteredSourceResults
	const isLoading = searchType === 'topic' ? isLoadingTopics : isLoadingSources

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[90vh] w-full max-w-[90vw] flex-col p-0 md:h-[600px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px]'
				showCloseButton={false}
			>
				<DialogHeader className='flex-shrink-0 px-3 pt-3 md:px-4 md:pt-4'>
					<DialogTitle className='sr-only'>Add Prerequisite</DialogTitle>
					<div className='flex flex-col gap-3'>
						<div className='flex gap-1'>
							<Button
								className={cn(
									'flex-1',
									searchType === 'topic' && 'bg-accent text-accent-foreground'
								)}
								onClick={() => setSearchType('topic')}
								size='sm'
								variant={searchType === 'topic' ? 'secondary' : 'ghost'}
							>
								Topics
							</Button>
							<Button
								className={cn(
									'flex-1',
									searchType === 'source' && 'bg-accent text-accent-foreground'
								)}
								onClick={() => setSearchType('source')}
								size='sm'
								variant={searchType === 'source' ? 'secondary' : 'ghost'}
							>
								Sources
							</Button>
						</div>
						<SearchInput
							inputRef={inputRef}
							onChange={handleSearchChange}
							onClear={handleClear}
							placeholder={`Search ${searchType}s...`}
							value={query}
						/>
					</div>
				</DialogHeader>

				<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-3 pt-0 md:p-4'>
					{searchType === 'topic' ? (
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
					) : (
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
				</div>
			</DialogContent>
		</Dialog>
	)
}
