import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { Search, SquarePen, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import { Input } from '~/components/ui/Input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import type { Review } from '~/features/reviews/api'
import {
	createTopicReview,
	deleteTopicReview
} from '~/features/topic_reviews/api'
import { searchTopics } from '~/features/topics/api/searchTopics'
import { useCreateTopic } from '~/features/topics/hooks/useCreateTopic'
import type { Topic } from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { AddTopicCard } from './AddTopicCard'
import { ReviewTopicCard } from './ReviewDetail/ReviewTopicCard'

const MIN_CARD_WIDTH = 280
const MIN_HEIGHT = 96

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
	// State
	const [searchQuery, setSearchQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	// Hooks
	const queryClient = useQueryClient()
	const { openTopicDialog } = useReviewTopicDialog()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()

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

	// Focus search input when dialog opens
	useEffect(() => {
		if (open) {
			setTimeout(() => {
				inputRef.current?.focus()
			}, 0)
			setSearchQuery('')
		}
	}, [open])

	// Search topics query
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

	// Mutations
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

	// Event handlers
	const handleCreateTopic = useCallback(async () => {
		try {
			const trimmedQuery = searchQuery.trim()

			const newTopic = await createTopicAsync({
				notes: trimmedQuery || ''
			})

			if (review) {
				await createTopicReviewMutation({
					reviewId: review.id,
					topicId: newTopic.id
				})

				// Open TopicDialog with newly created topic
				openTopicDialog(newTopic.id)
			}
		} catch (_error) {
			// Error handling could be added here if needed
		}
	}, [
		searchQuery,
		createTopicAsync,
		review,
		createTopicReviewMutation,
		openTopicDialog
	])

	const handleTopicClick = useCallback(
		async (topic: Topic) => {
			if (!review) return

			try {
				await createTopicReviewMutation({
					reviewId: review.id,
					topicId: topic.id
				})
				// Dialog stays open
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

	// Item size estimation for MasonryLayout
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

	const estimateTopicReviewItemSize = useCallback(
		(topicReview: { topic: Topic }) => {
			const topic = topicReview.topic
			const baseHeight = 72
			const nameLines = Math.ceil((topic.name?.length || 8) / 40)
			const notesLines = topic.notes
				? Math.min(2, Math.ceil(topic.notes.length / 40))
				: 0
			return Math.max(72, baseHeight + (nameLines - 1) * 20 + notesLines * 20)
		},
		[]
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

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	const hasQuery = Boolean(debouncedQuery.trim())

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[600px] w-full min-w-5xl flex-col p-0'
				showCloseButton={false}
			>
				<DialogHeader className='flex-shrink-0 px-4 pt-4'>
					<DialogTitle className='sr-only'>Add Topic to Review</DialogTitle>
					<div className='flex items-center gap-4'>
						<div className='relative flex-1'>
							<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
							<Input
								className='border-0 px-10 text-lg shadow-none'
								onChange={e => setSearchQuery(e.target.value)}
								placeholder='Search topics...'
								ref={inputRef}
								value={searchQuery}
							/>
							{searchQuery && (
								<button
									className='-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground transition-colors hover:text-foreground'
									onClick={() => setSearchQuery('')}
									type='button'
								>
									<X className='h-4 w-4' />
								</button>
							)}
						</div>
						<Button
							disabled={isCreatingTopic}
							onClick={handleCreateTopic}
							size='default'
							variant='secondary'
						>
							<SquarePen className='h-4 w-4' />
							Create New
						</Button>
						{topicCount !== undefined && (
							<Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
								<PopoverTrigger asChild={true}>
									<Button
										onClick={e => {
											e.stopPropagation()
											setIsPopoverOpen(!isPopoverOpen)
										}}
										size='default'
										variant='secondary'
									>
										{topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align='end'
									className='max-h-[500px] min-h-[350px] w-[600px] overflow-y-auto p-4'
									onClick={e => e.stopPropagation()}
									side='bottom'
								>
									{sortedTopicReviews && sortedTopicReviews.length > 0 ? (
										<div>
											<MasonryLayout
												estimateItemSize={estimateTopicReviewItemSize}
												gap={12}
												getItemKey={topicReview => topicReview.id}
												items={sortedTopicReviews}
												minItemWidth={250}
												renderItem={topicReview => (
													<ReviewTopicCard
														minHeight={72}
														onRemoveFromReview={handleRemoveTopicReview}
														onTopicClick={topic => {
															openTopicDialog(topic.id)
															setIsPopoverOpen(false)
														}}
														rating={topicReview.rating}
														topic={topicReview.topic}
														topicReviewId={topicReview.id}
													/>
												)}
											/>
										</div>
									) : (
										<div className='py-8 text-center text-muted-foreground'>
											No topics
										</div>
									)}
								</PopoverContent>
							</Popover>
						)}
						<Button
							onClick={() => onOpenChange(false)}
							size='default'
							variant='default'
						>
							Done
						</Button>
					</div>
				</DialogHeader>

				<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-4 pt-0'>
					{isLoading && (
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
							{hasQuery ? 'Searching...' : 'Loading recent topics...'}
						</div>
					)}

					{hasQuery && !isLoading && results.length === 0 && (
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							No topics found for "{searchQuery}"
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
							renderItem={renderAddTopicCard}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
