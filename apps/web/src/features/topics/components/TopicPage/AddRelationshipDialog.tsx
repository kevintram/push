import { useCallback, useEffect, useState } from 'react'
import { CreateTopicDialog } from '~/features/topics/components/CreateTopicDialog'
import type { Topic } from '~/types/topics.types'
import { useCreateRelationship } from '../../hooks/useCreateRelationship'
import { useDebouncedPotentialTopics } from '../../hooks/useDebouncedPotentialTopics'

interface AddRelationshipDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	topicId: number | undefined
	relationshipType: 'child' | 'parent'
	onRelationshipCreated?: (topic: Topic) => void
}

export function AddRelationshipDialog({
	open,
	onOpenChange,
	topicId,
	relationshipType,
	onRelationshipCreated
}: AddRelationshipDialogProps) {
	const [searchQuery, setSearchQuery] = useState('')

	const { setQuery, debouncedQuery, results, isLoading } =
		useDebouncedPotentialTopics({
			topicId,
			relationshipType,
			debounceMs: 300
		})

	const createRelationship = useCreateRelationship()

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

	const handleTopicCreatedOrSelected = useCallback(
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
			} catch (_error) {
				// Error handling could be added here if needed
			}
		},
		[topicId, relationshipType, createRelationship, onRelationshipCreated]
	)

	const useSearch = useCallback(
		(query: string) => {
			// Update search query when CreateTopicDialog's input changes
			useEffect(() => {
				setSearchQuery(query)
			}, [query])

			return {
				results,
				isLoading,
				debouncedQuery
			}
		},
		[results, isLoading, debouncedQuery]
	)

	const dialogTitle =
		relationshipType === 'child' ? 'Add Child Topic' : 'Add Parent Topic'

	return (
		<CreateTopicDialog
			onOpenChange={onOpenChange}
			onTopicCreated={handleTopicCreatedOrSelected}
			open={open}
			showSidebar={true}
			sidebarTitle={query => (query === '' ? 'Recent' : 'Matching Topics')}
			submitButtonText='Create New Topic'
			title={dialogTitle}
			useSearch={useSearch}
		/>
	)
}
