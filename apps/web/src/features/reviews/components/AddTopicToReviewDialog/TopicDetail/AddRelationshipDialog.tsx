import { SquarePen } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
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
import { TopicCard } from '~/features/topics/components/TopicCard'
import { useCreateRelationship } from '~/features/topics/hooks/useCreateRelationship'
import { useCreateTopic } from '~/features/topics/hooks/useCreateTopic'
import { useDebouncedPotentialTopics } from '~/features/topics/hooks/useDebouncedPotentialTopics'
import type { Topic } from '~/models/review-topic.types'

interface AddTopicToReviewRelationshipDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	topicId: number | undefined
	relationshipType: 'child' | 'parent'
	onRelationshipCreated?: (topicId: number) => void
	onTopicCreated?: (topicId: number) => void
}

export function AddTopicToReviewRelationshipDialog({
	open,
	onOpenChange,
	topicId: selectedTopicId,
	relationshipType,
	onRelationshipCreated,
	onTopicCreated
}: AddTopicToReviewRelationshipDialogProps) {
	// Refs
	const inputRef = useRef<HTMLInputElement>(null)

	// Hooks
	const { query, setQuery, debouncedQuery, results, isLoading } =
		useDebouncedPotentialTopics({
			topicId: selectedTopicId,
			relationshipType,
			debounceMs: 300,
			enabled: open
		})

	const createRelationship = useCreateRelationship()
	const createTopic = useCreateTopic()

	// Effects
	useEffect(() => {
		if (open) {
			setQuery('')
		}
	}, [open, setQuery])

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

	const dialogTitle =
		relationshipType === 'child' ? 'Add Child Topic' : 'Add Parent Topic'

	// Helper functions
	const createRelationshipWith = useCallback(
		async (topicIdToLink: number) => {
			if (!selectedTopicId) return

			if (relationshipType === 'child') {
				await createRelationship.mutateAsync({
					parent: selectedTopicId,
					child: topicIdToLink
				})
			} else {
				await createRelationship.mutateAsync({
					parent: topicIdToLink,
					child: selectedTopicId
				})
			}
		},
		[selectedTopicId, relationshipType, createRelationship]
	)

	// Main handlers
	const handleCreateTopicClick = useCallback(async () => {
		if (!selectedTopicId) return

		try {
			const newTopic = await createTopic.mutateAsync({
				name: '',
				notes: query.trim() || '',
				archived: false,
				inboxed: false
			})

			await createRelationshipWith(newTopic.id)
			onRelationshipCreated?.(newTopic.id)
			onTopicCreated?.(newTopic.id)
			onOpenChange(false)
		} catch (_error) {
			// Error is handled by React Query mutation state
		}
	}, [
		selectedTopicId,
		query,
		createTopic,
		createRelationshipWith,
		onRelationshipCreated,
		onTopicCreated,
		onOpenChange
	])

	const handleTopicSelected = useCallback(
		async (topic: Topic) => {
			if (!selectedTopicId) return

			try {
				await createRelationshipWith(topic.id)
				onRelationshipCreated?.(topic.id)
				onOpenChange(false)
			} catch (_error) {
				// Error is handled by React Query mutation state
			}
		},
		[
			selectedTopicId,
			createRelationshipWith,
			onRelationshipCreated,
			onOpenChange
		]
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

	// Render helpers
	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				minHeight={MIN_HEIGHT}
				onTopicClick={handleTopicSelected}
				reviews={topic.reviews ?? []}
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
					<DialogTitle className='sr-only'>{dialogTitle}</DialogTitle>
					<div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
						<SearchInput
							inputRef={inputRef}
							onChange={handleSearchChange}
							onClear={handleClear}
							value={query}
						/>
						<Button
							disabled={createTopic.isPending}
							onClick={handleCreateTopicClick}
							size='default'
							variant='secondary'
						>
							<SquarePen className='h-4 w-4' />
							Create New
						</Button>
					</div>
				</DialogHeader>

				<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-3 pt-0 md:p-4'>
					<SearchResultsContainer
						animate={false}
						estimateItemSize={estimateItemSize}
						getItemKey={topic => topic.id}
						hasQuery={searchResults.hasQuery}
						isLoading={searchResults.isLoading}
						renderItem={renderItem}
						results={searchResults.results}
						searchQuery={query}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
