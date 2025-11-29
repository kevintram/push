import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import type { Review } from '~/features/reviews/api'
import {
	createTopicReview,
	deleteTopicReview
} from '~/features/topic_reviews/api'
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

	// Calculate existing topic IDs from the review
	const existingTopicIds = useMemo(
		() => new Set(review?.topic_reviews?.map(tr => tr.topic_id) ?? []),
		[review?.topic_reviews]
	)

	// Calculate topic count
	const topicCount = review?.topic_reviews?.length ?? 0

	// Sort topic reviews by date added (descending)
	const sortedTopicReviews = useMemo(() => {
		if (!review?.topic_reviews) return []

		return [...review.topic_reviews].sort(
			(a, b) =>
				new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
		)
	}, [review?.topic_reviews])

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
				limit: 20
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

	const { mutateAsync: deleteTopicReviewMutation } = useMutation({
		mutationFn: deleteTopicReview,
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
				// Dialog stays open - removed onOpenChange(false)
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[review, createTopicReviewMutation]
	)

	const handleRemoveTopicReview = useCallback(
		async (topicReviewId: number) => {
			await deleteTopicReviewMutation(topicReviewId)
		},
		[deleteTopicReviewMutation]
	)

	const handleRemoveTopicClick = useCallback(
		async (topic: Topic) => {
			// Find the topicReviewId for this topic
			const topicReview = review?.topic_reviews?.find(
				tr => tr.topic_id === topic.id
			)
			if (topicReview) {
				await handleRemoveTopicReview(topicReview.id)
			}
		},
		[review?.topic_reviews, handleRemoveTopicReview]
	)

	const renderAddTopicCard = useCallback(
		(topic: Topic) => (
			<AddTopicCard
				isAdded={existingTopicIds.has(topic.id)}
				minHeight={72}
				onRemoveClick={handleRemoveTopicClick}
				onTopicClick={handleTopicClick}
				searchQuery={debouncedQuery}
				topic={topic}
			/>
		),
		[handleTopicClick, debouncedQuery, existingTopicIds, handleRemoveTopicClick]
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
			onRemoveTopicReview={handleRemoveTopicReview}
			onSearchQueryChange={setSearchQuery}
			onTopicCreated={handleTopicCreated}
			open={open}
			renderItem={renderAddTopicCard}
			reviewTopicReviews={sortedTopicReviews}
			title='Add Topic to Review'
			topicCount={topicCount}
			useSearch={useSearch}
		/>
	)
}
