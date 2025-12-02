import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, Minus, Search, SquarePen, X } from 'lucide-react'
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
import type { Review } from '~/features/reviews/api'
import {
	createTopicReview,
	deleteTopicReview
} from '~/features/topic_reviews/api'
import { updateTopicReview as updateTopicReviewApi } from '~/features/topic_reviews/api/updateTopicReview'
import { searchTopics } from '~/features/topics/api/searchTopics'
import { TopicDetail } from '~/features/topics/components/TopicDetail/TopicDetail'
import { useCreateTopic } from '~/features/topics/hooks/useCreateTopic'
import { useTopicWithRelationships } from '~/features/topics/hooks/useTopicWithRelationships'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import type { Rating, Topic } from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { ReviewTopicCard } from '../ReviewDetail/ReviewTopicCard'
import { AddTopicCard } from './AddTopicCard'
import { TopicReviewStatusButton } from './ReviewStatusButton'

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
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(
		undefined
	)
	const [viewMode, setViewMode] = useState<'search' | 'detail'>('search')
	const [isTopicMinimized, setIsTopicMinimized] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	// Hooks
	const queryClient = useQueryClient()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()
	const { topic: selectedTopic, isLoading: isLoadingTopic } =
		useTopicWithRelationships(selectedTopicId)
	const debouncedQuery = useDebouncedValue(searchQuery, 300)

	const addedTopics = useMemo(
		() => new Set(review?.topic_reviews?.map(tr => tr.topic_id) ?? []),
		[review?.topic_reviews]
	)
	const isTopicAdded = useCallback(
		(topicId: number) => addedTopics.has(topicId),
		[addedTopics]
	)

	const addedTopicsCount = review?.topic_reviews?.length ?? 0

	// Check if the review is completed
	const isReviewCompleted = useMemo(
		() => !!review?.completed_at,
		[review?.completed_at]
	)

	// Focus search input when dialog opens
	useEffect(() => {
		if (open) {
			setTimeout(() => {
				inputRef.current?.focus()
			}, 0)
			setSearchQuery('')
		} else {
			setViewMode('search')
			setIsTopicMinimized(false)
			setSelectedTopicId(undefined)
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
			topicId,
			rating
		}: {
			reviewId: number
			topicId: number
			rating?: Rating | null
		}) => createTopicReview(reviewId, topicId, rating),
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

	const { mutateAsync: updateTopicReviewMutation } = useMutation({
		mutationFn: ({ id, rating }: { id: number; rating: Rating }) =>
			updateTopicReviewApi(id, rating),
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
					topicId: newTopic.id,
					rating: isReviewCompleted ? 'good' : null
				})
				// Navigate to detail view instead of opening TopicDialog
				setSelectedTopicId(newTopic.id)
				setViewMode('detail')
			}
		} catch (_error) {
			// Error handling could be added here if needed
		}
	}, [
		searchQuery,
		createTopicAsync,
		review,
		createTopicReviewMutation,
		isReviewCompleted
	])

	const handleTopicClick = useCallback(
		async (topic: Topic) => {
			if (!review) return

			try {
				await createTopicReviewMutation({
					reviewId: review.id,
					topicId: topic.id,
					rating: isReviewCompleted ? 'good' : null
				})
				// Dialog stays open
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[review, createTopicReviewMutation, isReviewCompleted]
	)

	// Callback for when a new topic is created from nested views (parents/children)
	// This ensures the newly created topic is also added to the review
	const handleNestedTopicCreated = useCallback(
		async (topic: Topic) => {
			if (!review) return

			try {
				await createTopicReviewMutation({
					reviewId: review.id,
					topicId: topic.id,
					rating: isReviewCompleted ? 'good' : null
				})
				// Also select it to show it in the detail view
				setSelectedTopicId(topic.id)
				setViewMode('detail')
				setIsTopicMinimized(false)
			} catch (_error) {
				// Handle error silently for now
			}
		},
		[review, createTopicReviewMutation, isReviewCompleted]
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

	const handleCardDetailClick = useCallback(
		(topic: Topic) => {
			// If clicking the same topic that's already selected
			if (selectedTopicId === topic.id) {
				// If minimized, expand it
				if (isTopicMinimized) {
					setIsTopicMinimized(false)
				}
				// If already expanded, do nothing (topic is already showing)
			} else {
				// Clicking a different topic
				// If TopicDetail is currently expanded (not minimized), minimize it
				if (viewMode === 'detail' && !isTopicMinimized) {
					setIsTopicMinimized(true)
				} else if (viewMode === 'detail' && isTopicMinimized) {
					// If currently minimized, expand the new topic
					setIsTopicMinimized(false)
				}
				// Set the new topic and ensure detail view
				setSelectedTopicId(topic.id)
				setViewMode('detail')
			}
		},
		[selectedTopicId, isTopicMinimized, viewMode]
	)

	const onTopicDetailClose = useCallback(() => {
		setViewMode('search')
		setIsTopicMinimized(false)
		setTimeout(() => setSelectedTopicId(undefined), 200)
	}, [])

	const onTopicDeleted = useCallback(() => {
		setViewMode('search')
		setIsTopicMinimized(false)
		setSelectedTopicId(undefined)
	}, [])

	const onToicDetailMinimize = useCallback(() => {
		setIsTopicMinimized(true)
	}, [])

	const onTopicDetailMaximize = useCallback(() => {
		setIsTopicMinimized(false)
	}, [])

	const onSearchFocus = useCallback(() => {
		// If TopicDetail is expanded (not minimized), minimize it when search is focused
		if (viewMode === 'detail' && !isTopicMinimized) {
			setIsTopicMinimized(true)
		}
	}, [viewMode, isTopicMinimized])

	const onTopicSwitched = useCallback((topic: Topic) => {
		setSelectedTopicId(topic.id)
		setViewMode('detail')
		setIsTopicMinimized(false)
	}, [])

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			// If TopicDetail is expanded (not minimized), minimize it when user starts typing
			if (viewMode === 'detail' && !isTopicMinimized) {
				setIsTopicMinimized(true)
			}
			setSearchQuery(e.target.value)
		},
		[viewMode, isTopicMinimized]
	)

	const handleRatingChange = useCallback(
		async (topicReviewId: number, rating: Rating) => {
			await updateTopicReviewMutation({ id: topicReviewId, rating })
		},
		[updateTopicReviewMutation]
	)

	// Helper to get topic review for a topic
	const getTopicReview = useCallback(
		(topicId: number) => {
			return review?.topic_reviews?.find(tr => tr.topic_id === topicId)
		},
		[review?.topic_reviews]
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
		(topic: Topic, removeRelationship?: () => void) => {
			const topicReview = getTopicReview(topic.id)
			return (
				<AddTopicCard
					isAdded={isTopicAdded(topic.id)}
					isReviewCompleted={isReviewCompleted}
					minHeight={72}
					onCardClick={
						removeRelationship
							? () => onTopicSwitched(topic)
							: handleCardDetailClick
					}
					onRatingChange={handleRatingChange}
					onRemoveClick={handleRemoveTopicClick}
					onRemoveRelationship={removeRelationship}
					onTopicClick={handleTopicClick}
					rating={topicReview?.rating}
					searchQuery={debouncedQuery}
					topic={topic}
					topicReviewId={topicReview?.id}
				/>
			)
		},
		[
			handleTopicClick,
			debouncedQuery,
			isTopicAdded,
			handleRemoveTopicClick,
			handleCardDetailClick,
			onTopicSwitched,
			getTopicReview,
			handleRatingChange,
			isReviewCompleted
		]
	)

	const renderSearchResultItem = useCallback(
		(topic: Topic) => renderAddTopicCard(topic),
		[renderAddTopicCard]
	)

	const getSearchResultItemKey = useCallback((topic: Topic) => topic.id, [])

	const hasQuery = Boolean(debouncedQuery.trim())

	const selectedTopicIsAdded = useMemo(
		() => (selectedTopic ? isTopicAdded(selectedTopic.id) : false),
		[selectedTopic, isTopicAdded]
	)

	const selectedTopicReview = useMemo(
		() => (selectedTopic ? getTopicReview(selectedTopic.id) : undefined),
		[selectedTopic, getTopicReview]
	)

	const topicContextValue = useMemo(
		() => ({
			topic: selectedTopic,
			isLoading: isLoadingTopic
		}),
		[selectedTopic, isLoadingTopic]
	)

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[600px] w-full max-w-[90vw] flex-col p-0 md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1100px] 2xl:max-w-[1200px]'
				showCloseButton={false}
			>
				<DialogHeader className='flex-shrink-0 px-4 pt-4'>
					<DialogTitle className='sr-only'>Add Topic to Review</DialogTitle>
					<div className='flex items-center gap-4'>
						{addedTopicsCount !== undefined && (
							<Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
								<PopoverTrigger asChild={true}>
									<Button
										className='px-2 font-semibold text-md'
										onClick={e => {
											e.stopPropagation()
											setIsPopoverOpen(!isPopoverOpen)
										}}
										size='default'
										variant='link'
									>
										{addedTopicsCount} topics added to review
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align='start'
									className='max-h-[500px] min-h-[350px] w-[600px] overflow-y-auto bg-background p-4'
									onClick={e => e.stopPropagation()}
									side='bottom'
								>
									{review?.topic_reviews && review.topic_reviews.length > 0 ? (
										<div>
											<MasonryLayout
												estimateItemSize={estimateTopicReviewItemSize}
												gap={12}
												getItemKey={topicReview => topicReview.id}
												items={review.topic_reviews}
												minItemWidth={250}
												renderItem={topicReview => (
													<ReviewTopicCard
														minHeight={72}
														onRemoveFromReview={handleRemoveTopicReview}
														onTopicClick={topic => {
															setSelectedTopicId(topic.id)
															setViewMode('detail')
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
						<div className='relative flex-1'>
							<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
							<Input
								className='border-0 px-10 text-lg shadow-none'
								onChange={handleSearchChange}
								onFocus={onSearchFocus}
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
					<AnimatePresence initial={false} mode='wait'>
						{viewMode === 'search' ||
						(viewMode === 'detail' && isTopicMinimized) ? (
							<motion.div
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								initial={{ opacity: 0 }}
								key='search-view'
								transition={{ duration: 0.12 }}
							>
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
										getItemKey={getSearchResultItemKey}
										items={results}
										minItemWidth={MIN_CARD_WIDTH}
										renderItem={renderSearchResultItem}
									/>
								)}
							</motion.div>
						) : (
							<motion.div
								animate={{ opacity: 1, scale: 1 }}
								className='h-full overflow-hidden rounded-md border-1'
								exit={{ opacity: 0, scale: 0.98 }}
								initial={{ opacity: 0, scale: 0.95 }}
								key='topic-detail'
								layoutId='topic-container'
								transition={{
									layout: { duration: 0.25, ease: 'easeInOut' },
									opacity: { duration: 0.18 },
									scale: { duration: 0.18 }
								}}
							>
								<AnimatePresence mode='wait'>
									{!isTopicMinimized && (
										<motion.div
											animate={{ opacity: 1 }}
											className='h-full'
											exit={{ opacity: 0 }}
											initial={{ opacity: 0 }}
											key='topic-detail-content'
											transition={{ duration: 0.15 }}
										>
											<TopicContext value={topicContextValue}>
												<TopicDetail
													afterMoreButton={
														<>
															<Button
																className='h-6 w-6 p-0 text-muted-foreground'
																onClick={onToicDetailMinimize}
																size='sm'
																title='Minimize'
																variant='ghost'
															>
																<Minus className='h-4 w-4' />
															</Button>
															<Button
																className='h-6 w-6 p-0 text-muted-foreground'
																onClick={onTopicDetailClose}
																size='sm'
																title='Back to search'
																variant='ghost'
															>
																<X className='h-4 w-4' />
															</Button>
														</>
													}
													allowReviewCreation={false}
													beforeMoreButton={
														selectedTopic ? (
															<TopicReviewStatusButton
																isAdded={selectedTopicIsAdded}
																isReviewCompleted={isReviewCompleted}
																onAdd={() => handleTopicClick(selectedTopic)}
																onRatingChange={
																	selectedTopicReview
																		? rating =>
																				handleRatingChange(
																					selectedTopicReview.id,
																					rating
																				)
																		: undefined
																}
																onRemove={() =>
																	handleRemoveTopicClick(selectedTopic)
																}
																rating={selectedTopicReview?.rating}
															/>
														) : null
													}
													onChildClicked={onTopicSwitched}
													onDelete={onTopicDeleted}
													onParentClicked={onTopicSwitched}
													onTopicCreated={handleNestedTopicCreated}
													renderChildCard={renderAddTopicCard}
													reviewSidebarReadonly={true}
												/>
											</TopicContext>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Floating card for minimized state */}
				{viewMode === 'detail' && isTopicMinimized && selectedTopic && (
					<motion.button
						aria-label='Restore topic detail'
						className='fixed right-4 bottom-4 z-50 flex cursor-pointer items-center gap-2 overflow-hidden rounded-lg border bg-background p-3 hover:bg-muted'
						layoutId='topic-container'
						onClick={onTopicDetailMaximize}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								onTopicDetailMaximize()
							}
						}}
						tabIndex={0}
					>
						<AnimatePresence mode='wait'>
							{isTopicMinimized && (
								<motion.div
									animate={{ opacity: 1 }}
									className='flex items-center gap-2'
									exit={{ opacity: 0 }}
									initial={{ opacity: 0 }}
									key='floating-card-content'
									transition={{
										opacity: { duration: 0.15, delay: 0.15 }
									}}
								>
									<ChevronUp className='h-4 w-4 text-muted-foreground' />
									<span className='flex-1'>
										{selectedTopic.name ||
											selectedTopic.notes ||
											'Untitled Topic'}
									</span>
									<Button
										className='h-5 w-5 p-0 text-muted-foreground'
										onClick={e => {
											e.stopPropagation()
											onTopicDetailClose()
										}}
										size='sm'
										title='Close'
										variant='ghost'
									>
										<X className='h-3 w-3' />
									</Button>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.button>
				)}
			</DialogContent>
		</Dialog>
	)
}
