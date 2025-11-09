import { useNavigate } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { Input } from '~/components/ui/Input'
import { TopicCard } from '~/features/topics/components/TopicCard'
import { useGlobalSearch } from '~/hooks/useGlobalSearch'
import type { Topic } from '~/models/todo-topic.types'

const MIN_CARD_WIDTH = 280
const MIN_HEIGHT = 96

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

	const { debouncedQuery, results, isLoading, hasQuery } = useGlobalSearch(
		query,
		open
	)

	useEffect(() => {
		if (open) {
			setTimeout(() => {
				inputRef.current?.focus()
			}, 0)
		} else {
			setSelectedIndex(0)
		}
	}, [open])

	useEffect(() => {
		setSelectedIndex(0)
	}, [query])

	const handleTopicSelect = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/{-$topicId}',
				params: { topicId: topic.id.toString() }
			})
			onOpenChange(false)
		},
		[navigate, onOpenChange]
	)

	const handleKeyDown = (e: React.KeyboardEvent) => {
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
	}

	const estimateItemSize = useCallback((topic: Topic) => {
		const baseHeight = 80
		const lineHeight = 20
		const charsPerLine = 40

		const nameLines = Math.ceil((topic.name?.length || 8) / charsPerLine)
		const notesLines = topic.notes
			? Math.min(2, Math.ceil(topic.notes.length / charsPerLine))
			: 0

		return Math.max(
			MIN_HEIGHT,
			baseHeight + (nameLines - 1) * lineHeight + notesLines * lineHeight
		)
	}, [])

	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				minHeight={MIN_HEIGHT}
				onTopicClick={handleTopicSelect}
				searchQuery={debouncedQuery}
				todos={topic.todos ?? []}
				topic={topic}
			/>
		),
		[handleTopicSelect, debouncedQuery]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 fixed top-0 left-1/2 w-full min-w-5xl translate-y-0 p-0'
				showCloseButton={false}
			>
				<DialogHeader className='px-4 pt-2 pb-0'>
					<DialogTitle className='sr-only'>Search topics</DialogTitle>
					<div className='relative'>
						<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
						<Input
							className='border-0 px-10 text-lg shadow-none'
							onChange={e => setQuery(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder='Search topics...'
							ref={inputRef}
							value={query}
						/>
						{query && (
							<button
								className='-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground transition-colors hover:text-foreground'
								onClick={() => setQuery('')}
								type='button'
							>
								<X className='h-4 w-4' />
							</button>
						)}
					</div>
				</DialogHeader>

				<div className='scrollbar-track-transparent max-h-192 min-h-80 overflow-y-auto p-4 pt-0'>
					{isLoading && (
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
							{hasQuery ? 'Searching...' : 'Loading recent topics...'}
						</div>
					)}

					{hasQuery && !isLoading && results.length === 0 && (
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							No topics found for "{query}"
						</div>
					)}

					{!(hasQuery || isLoading) && results.length === 0 && (
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							No topics found
						</div>
					)}

					{results.length > 0 && (
						<div className='mb-2'>
							{!hasQuery && (
								<div className='mb-3 font-medium text-muted-foreground text-sm'>
									Recent
								</div>
							)}
						</div>
					)}

					{results.length > 0 && (
						<MasonryLayout
							estimateItemSize={estimateItemSize}
							gap={12}
							getItemKey={getItemKey}
							items={results}
							minItemWidth={MIN_CARD_WIDTH}
							renderItem={renderItem}
						/>
					)}
				</div>

				<div className='border-t px-4 py-2 text-muted-foreground text-xs'>
					<kbd className='rounded bg-muted px-1.5 py-0.5 text-xs'>↑↓</kbd> to
					navigate
					<kbd className='ml-2 rounded bg-muted px-1.5 py-0.5 text-xs'>↵</kbd>{' '}
					to select
					<kbd className='ml-2 rounded bg-muted px-1.5 py-0.5 text-xs'>esc</kbd>{' '}
					to close
				</div>
			</DialogContent>
		</Dialog>
	)
}
