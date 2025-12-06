import { SquarePen } from 'lucide-react'
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
	DialogTitle
} from '~/components/ui/Dialog'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/models/review-topic.types'
import { useCreateRelationship } from '../../hooks/useCreateRelationship'
import { useCreateTopic } from '../../hooks/useCreateTopic'
import { useDebouncedPotentialTopics } from '../../hooks/useDebouncedPotentialTopics'

interface AddRelationshipDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	topicId: number | undefined
	relationshipType: 'child' | 'parent'
	onRelationshipCreated?: (topic: Topic) => void
	onTopicOpen?: (topic: Topic) => void
}
export function AddRelationshipDialog({
	open,
	onOpenChange,
	topicId,
	relationshipType,
	onRelationshipCreated,
	onTopicOpen
}: AddRelationshipDialogProps) {
	// State
	const [searchQuery, setSearchQuery] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	// Hooks
	const { setQuery, debouncedQuery, results, isLoading } =
		useDebouncedPotentialTopics({
			topicId,
			relationshipType,
			debounceMs: 300,
			enabled: open
		})
	const createRelationship = useCreateRelationship()
	const createTopic = useCreateTopic()
	const { openTopicDialog } = useReviewTopicDialog()

	// Effects
	useEffect(() => {
		if (open) {
			setQuery('')
			setSearchQuery('')
		}
	}, [open, setQuery])

	useEffect(() => {
		setQuery(searchQuery)
	}, [searchQuery, setQuery])

	useEffect(() => {
		if (open) {
			requestAnimationFrame(() => {
				inputRef.current?.focus()
			})
		}
	}, [open])

	// Memoized values
	const searchResults = useMemo(
		() => ({
			results,
			isLoading,
			debouncedQuery,
			hasQuery: Boolean(debouncedQuery.trim())
		}),
		[results, isLoading, debouncedQuery]
	)

	const dialogTitle = useMemo(
		() =>
			relationshipType === 'child' ? 'Add Child Topic' : 'Add Parent Topic',
		[relationshipType]
	)

	// Helper functions
	const createRelationshipForTopic = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			if (relationshipType === 'child') {
				await createRelationship.mutateAsync({
					parent: topicId,
					child: topic.id
				})
			} else {
				await createRelationship.mutateAsync({
					parent: topic.id,
					child: topicId
				})
			}

			onRelationshipCreated?.(topic)
		},
		[topicId, relationshipType, createRelationship, onRelationshipCreated]
	)

	// Event handlers
	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value)
		},
		[]
	)

	const handleClear = useCallback(() => {
		setSearchQuery('')
	}, [])

	const handleTopicSelected = useCallback(
		async (topic: Topic) => {
			try {
				await createRelationshipForTopic(topic)

				// Don't auto-open dialog for selected topics - user explicitly selected it
				if (onTopicOpen) {
					onTopicOpen(topic)
				}
			} catch {
				// Error is handled by React Query mutation state
			}
		},
		[createRelationshipForTopic, onTopicOpen]
	)

	const handleCreateNewTopic = useCallback(async () => {
		try {
			const trimmedQuery = searchQuery.trim()
			const newTopic = await createTopic.mutateAsync({
				notes: trimmedQuery || ''
			})

			await createRelationshipForTopic(newTopic)

			// Open TopicDialog with newly created topic
			if (onTopicOpen) {
				onTopicOpen(newTopic)
			} else {
				openTopicDialog(newTopic.id)
			}

			onOpenChange(false)
		} catch {
			// Error is handled by React Query mutation state
		}
	}, [
		createTopic,
		createRelationshipForTopic,
		openTopicDialog,
		onTopicOpen,
		onOpenChange,
		searchQuery
	])

	// Render helpers
	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				minHeight={MIN_HEIGHT}
				onTopicClick={handleTopicSelected}
				reviews={topic.reviews ?? []}
				searchQuery={searchResults.debouncedQuery}
				topic={topic}
			/>
		),
		[handleTopicSelected, searchResults.debouncedQuery]
	)

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[600px] w-full min-w-5xl flex-col p-0'
				showCloseButton={false}
			>
				<DialogHeader className='flex-shrink-0 px-4 pt-4'>
					<DialogTitle className='sr-only'>{dialogTitle}</DialogTitle>
					<div className='flex items-center gap-4'>
						<SearchInput
							inputRef={inputRef}
							onChange={handleSearchChange}
							onClear={handleClear}
							value={searchQuery}
						/>
						<Button
							disabled={createTopic.isPending}
							onClick={handleCreateNewTopic}
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
		</Dialog>
	)
}
