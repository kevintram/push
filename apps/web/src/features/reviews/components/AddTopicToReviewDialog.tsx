import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import type { Review } from '~/features/reviews/api'
import { createTopicReview } from '~/features/topic_reviews/api'
import { searchTopics } from '~/features/topics/api/searchTopics'
import { SearchOrCreateTopicDialog } from '~/features/topics/components/SearchOrCreateTopicDialog'
import type { Topic } from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { AddTopicCard } from './AddTopicCard'

interface AddTopicToReviewDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	review: Review | undefined
}

export function AddTopicToReviewDialog({
	open,
	onOpenChange,
	review
}: AddTopicToReviewDialogProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const queryClient = useQueryClient()
	const { openTopicDialog } = useReviewTopicDialog()

	// Debounced search query
	const updateDebouncedQuery = useCallback(
		debounce((term: string) => setDebouncedQuery(term), 300),
		[]
	)

	useEffect(() => {
		updateDebouncedQuery(searchQuery)
	}, [searchQuery, updateDebouncedQuery])

	const { data: topics = [], isLoading } = useQuery({
		queryKey: ['topics', 'search', debouncedQuery || 'recent', review?.id],
		queryFn: () =>
			searchTopics({
				query: debouncedQuery || undefined,
				limit: 20,
				addableToReview: review?.id
			}),
		enabled: open && !!review
	})

	const results = useMemo(() => {
		if (!debouncedQuery) {
			return topics?.slice(0, 10) ?? [] // Show recent topics when no search
		}
		return topics ?? []
	}, [topics, debouncedQuery])

	const { mutateAsync: createTopicReviewMutation } = useMutation({
		mutationFn: ({
			reviewId,
			topicId
		}: {
			reviewId: number
			topicId: number
		}) => createTopicReview(reviewId, topicId, 'good'),
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	// Reset state when dialog opens/closes
	useEffect(() => {
		if (open) {
			setSearchQuery('')
		}
	}, [open])

	const handleTopicCreated = useCallback(
		async (topic: Topic) => {
			if (!review) return

			try {
				await createTopicReviewMutation({
					reviewId: review.id,
					topicId: topic.id
				})

				// Open TopicDialog with newly created topic
				openTopicDialog(topic.id)
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[review, createTopicReviewMutation, openTopicDialog]
	)

	const handleTopicClick = useCallback(
		async (topic: Topic) => {
			if (!review) return

			try {
				await createTopicReviewMutation({
					reviewId: review.id,
					topicId: topic.id
				})

				// Close the dialog immediately
				onOpenChange(false)
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[review, createTopicReviewMutation, onOpenChange]
	)

	const renderAddTopicCard = useCallback(
		(topic: Topic) => (
			<AddTopicCard
				minHeight={72}
				onTopicClick={handleTopicClick}
				searchQuery={debouncedQuery}
				topic={topic}
			/>
		),
		[handleTopicClick, debouncedQuery]
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

	return (
		<SearchOrCreateTopicDialog
			onOpenChange={onOpenChange}
			onSearchQueryChange={setSearchQuery}
			onTopicCreated={handleTopicCreated}
			open={open}
			renderItem={renderAddTopicCard}
			title='Add Topic to Review'
			useSearch={useSearch}
		/>
	)
}
