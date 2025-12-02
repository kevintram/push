import { useCallback, useEffect, useState } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { SearchOrCreateTopicDialog } from '~/features/topics/components/SearchOrCreateTopicDialog'
import type { Topic } from '~/models/review-topic.types'
import { useCreateRelationship } from '../../hooks/useCreateRelationship'
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
	const [searchQuery, setSearchQuery] = useState('')

	const { setQuery, debouncedQuery, results, isLoading } =
		useDebouncedPotentialTopics({
			topicId,
			relationshipType,
			debounceMs: 300,
			enabled: open
		})

	const createRelationship = useCreateRelationship()
	const { openTopicDialog } = useReviewTopicDialog()

	// Reset query when dialog opens/closes
	useEffect(() => {
		if (open) {
			setQuery('')
			setSearchQuery('')
		}
	}, [open, setQuery])

	// Sync search query with debounced hook
	useEffect(() => {
		setQuery(searchQuery)
	}, [searchQuery, setQuery])

	const handleTopicCreated = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			try {
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

				// Open TopicDialog with newly created topic
				if (onTopicOpen) {
					onTopicOpen(topic)
				} else {
					openTopicDialog(topic.id)
				}
			} catch (_error) {
				// Error handling could be added here if needed
			}
		},
		[
			topicId,
			relationshipType,
			createRelationship,
			onRelationshipCreated,
			openTopicDialog,
			onTopicOpen
		]
	)

	const handleTopicSelected = useCallback(
		async (topic: Topic) => {
			if (!topicId) return

			try {
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

				// Open selected topic
				if (onTopicOpen) {
					onTopicOpen(topic)
				} else {
					// We might want to open it, or maybe not for "select existing"?
					// The previous code didn't open it for "select existing" in handleTopicSelected?
					// Wait, looking at handleTopicSelected below...
				}
			} catch (_error) {
				// Error handling could be added here if needed
			}
		},
		[
			topicId,
			relationshipType,
			createRelationship,
			onRelationshipCreated,
			onTopicOpen
		]
	)

	const useSearch = useCallback(
		(_query: string) => {
			return {
				results,
				isLoading,
				debouncedQuery,
				hasQuery: Boolean(debouncedQuery.trim())
			}
		},
		[results, isLoading, debouncedQuery]
	)

	const dialogTitle =
		relationshipType === 'child' ? 'Add Child Topic' : 'Add Parent Topic'

	return (
		<SearchOrCreateTopicDialog
			onOpenChange={onOpenChange}
			onSearchQueryChange={setSearchQuery}
			onTopicCreated={handleTopicCreated}
			onTopicSelected={handleTopicSelected}
			open={open}
			title={dialogTitle}
			useSearch={useSearch}
		/>
	)
}
