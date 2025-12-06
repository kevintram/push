import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { SquarePen } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SearchInput, SearchResultsContainer } from '~/components/search'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '~/components/ui/Dialog'
import type { Review } from '~/features/reviews/api'
import {
	createTopicReview,
	deleteTopicReview
} from '~/features/topic_reviews/api'
import { updateTopicReview as updateTopicReviewApi } from '~/features/topic_reviews/api/updateTopicReview'
import { searchTopics } from '~/features/topics/api/searchTopics'
import { useTopicWithRelationships } from '~/features/topics/hooks/useTopicWithRelationships'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import type { Rating, Topic, TopicReview } from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { ReviewTopicCard } from '../ReviewDetail/ReviewTopicCard'
import { AddedTopicsPopover } from './AddedTopicsPopover'
import { AddTopicCard } from './AddTopicCard'
import { FloatingTopicCard } from './FloatingTopicCard'
import { ReviewTopicDetail } from './ReviewTopicDetail'

// Constants
const MIN_HEIGHT = 72

// Types
interface AddTopicToReviewDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	review: Review | undefined
}

type ViewMode = 'search' | 'detail'

// Main Component
export function AddTopicToReviewDialog({
	open,
	onOpenChange,
	review
}: AddTopicToReviewDialogProps) {
	const queryClient = useQueryClient()
	const inputRef = useRef<HTMLInputElement>(null)

	// State
	const [searchQuery, setSearchQuery] = useState('')
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(
		undefined
	)
	const [viewMode, setViewMode] = useState<ViewMode>('search')
	const [isTopicMinimized, setIsTopicMinimized] = useState(false)

	// External Hooks
	const { topic: selectedTopic, isLoading: isLoadingTopic } =
		useTopicWithRelationships(selectedTopicId)
	const debouncedQuery = useDebouncedValue(searchQuery, 300)

	// Derived State
	const addedTopics = useMemo(
		() => new Set(review?.topic_reviews?.map(tr => tr.topic_id) ?? []),
		[review?.topic_reviews]
	)

	const addedTopicsCount = review?.topic_reviews?.length ?? 0
	const isReviewCompleted = useMemo(
		() => !!review?.completed_at,
		[review?.completed_at]
	)
	const hasQuery = Boolean(debouncedQuery.trim())

	// Queries
	const { data: topics = [], isLoading: isSearching } = useQuery({
		queryKey: ['topics', 'search', debouncedQuery || 'recent', review?.id],
		queryFn: () =>
			searchTopics({
				query: debouncedQuery || undefined,
				limit: 20
			}),
		enabled: open && !!review
	})

	const searchResults = useMemo(() => {
		if (!debouncedQuery) {
			return topics?.slice(0, 10) ?? []
		}
		return topics ?? []
	}, [topics, debouncedQuery])

	// Mutations
	const {
		mutateAsync: createTopicReviewMutation,
		isPending: isCreatingTopicReview
	} = useMutation({
		mutationFn: createTopicReview,
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

	// Effects
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

	// Helper Functions
	const isTopicAdded = useCallback(
		(topicId: number) => addedTopics.has(topicId),
		[addedTopics]
	)

	const getTopicReview = useCallback(
		(topicId: number) => {
			return review?.topic_reviews?.find(tr => tr.topic_id === topicId)
		},
		[review?.topic_reviews]
	)

	// Topic Review Actions
	const addTopicToReview = useCallback(
		async (topic: Topic) => {
			if (!review) return

			try {
				await createTopicReviewMutation({
					review_id: review.id,
					topic_id: topic.id,
					rating: isReviewCompleted ? 'good' : null
				})
			} catch {
				// Handle error silently for now
			}
		},
		[review, createTopicReviewMutation, isReviewCompleted]
	)

	const removeTopicReview = useCallback(
		async (topicReviewId: number) => {
			await deleteTopicReviewMutation(topicReviewId)
		},
		[deleteTopicReviewMutation]
	)

	const removeTopicFromReview = useCallback(
		async (topic: Topic) => {
			const topicReview = review?.topic_reviews?.find(
				tr => tr.topic_id === topic.id
			)
			if (topicReview) {
				await removeTopicReview(topicReview.id)
			}
		},
		[review?.topic_reviews, removeTopicReview]
	)

	const updateRating = useCallback(
		async (topicReviewId: number, rating: Rating) => {
			await updateTopicReviewMutation({ id: topicReviewId, rating })
		},
		[updateTopicReviewMutation]
	)

	// Topic Creation
	const createNewTopic = useCallback(async () => {
		if (!review) return

		try {
			const trimmedQuery = searchQuery.trim()

			// Create topic and link to review in a single API call
			const topicReview = await createTopicReviewMutation({
				review_id: review.id,
				topic: {
					name: '',
					notes: trimmedQuery || '',
					archived: false,
					inboxed: true
				},
				rating: isReviewCompleted ? 'good' : null
			})

			setSelectedTopicId(topicReview.topic_id)
			setViewMode('detail')
		} catch {
			// Error handling could be added here if needed
		}
	}, [searchQuery, review, createTopicReviewMutation, isReviewCompleted])

	const handleNestedTopicCreated = useCallback(
		async (topic: Topic) => {
			if (!review) return

			try {
				await createTopicReviewMutation({
					review_id: review.id,
					topic_id: topic.id,
					rating: isReviewCompleted ? 'good' : null
				})
				setSelectedTopicId(topic.id)
				setViewMode('detail')
				setIsTopicMinimized(false)
			} catch {
				// Handle error silently for now
			}
		},
		[review, createTopicReviewMutation, isReviewCompleted]
	)

	// View State Management
	const openTopicDetail = useCallback(
		(topic: Topic) => {
			if (selectedTopicId === topic.id) {
				if (isTopicMinimized) {
					setIsTopicMinimized(false)
				}
			} else {
				if (viewMode === 'detail' && !isTopicMinimized) {
					setIsTopicMinimized(true)
				} else if (viewMode === 'detail' && isTopicMinimized) {
					setIsTopicMinimized(false)
				}
				setSelectedTopicId(topic.id)
				setViewMode('detail')
			}
		},
		[selectedTopicId, isTopicMinimized, viewMode]
	)

	const switchToTopic = useCallback((topic: Topic) => {
		setSelectedTopicId(topic.id)
		setViewMode('detail')
		setIsTopicMinimized(false)
	}, [])

	const closeTopicDetail = useCallback(() => {
		setViewMode('search')
		setIsTopicMinimized(false)
		setTimeout(() => setSelectedTopicId(undefined), 200)
	}, [])

	const handleTopicDeleted = useCallback(() => {
		setViewMode('search')
		setIsTopicMinimized(false)
		setSelectedTopicId(undefined)
	}, [])

	const minimizeTopicDetail = useCallback(() => {
		setIsTopicMinimized(true)
	}, [])

	const maximizeTopicDetail = useCallback(() => {
		setIsTopicMinimized(false)
	}, [])

	// Search Handlers
	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (viewMode === 'detail' && !isTopicMinimized) {
				setIsTopicMinimized(true)
			}
			setSearchQuery(e.target.value)
		},
		[viewMode, isTopicMinimized]
	)

	const handleSearchFocus = useCallback(() => {
		if (viewMode === 'detail' && !isTopicMinimized) {
			setIsTopicMinimized(true)
		}
	}, [viewMode, isTopicMinimized])

	const clearSearch = useCallback(() => {
		setSearchQuery('')
	}, [])

	// ---------------------------------------------------------------------------
	// Popover Handlers
	// ---------------------------------------------------------------------------

	const openPopoverAndSelectTopic = useCallback((topic: Topic) => {
		setSelectedTopicId(topic.id)
		setViewMode('detail')
		setIsPopoverOpen(false)
	}, [])

	// ---------------------------------------------------------------------------
	// Memoized Values for Selected Topic
	// ---------------------------------------------------------------------------

	const selectedTopicIsAdded = useMemo(
		() => (selectedTopic ? isTopicAdded(selectedTopic.id) : false),
		[selectedTopic, isTopicAdded]
	)

	const selectedTopicReview = useMemo(
		() => (selectedTopic ? getTopicReview(selectedTopic.id) : undefined),
		[selectedTopic, getTopicReview]
	)

	// Render Callbacks
	const renderAddTopicCard = useCallback(
		(topic: Topic, removeRelationship?: () => void) => {
			const topicReviewData = getTopicReview(topic.id)
			return (
				<AddTopicCard
					isAdded={isTopicAdded(topic.id)}
					isReviewCompleted={isReviewCompleted}
					minHeight={MIN_HEIGHT}
					onCardClick={
						removeRelationship ? () => switchToTopic(topic) : openTopicDetail
					}
					onRatingChange={updateRating}
					onRemoveClick={removeTopicFromReview}
					onRemoveRelationship={removeRelationship}
					onTopicClick={addTopicToReview}
					rating={topicReviewData?.rating}
					searchQuery={hasQuery ? searchQuery : ''}
					topic={topic}
					topicReviewId={topicReviewData?.id}
				/>
			)
		},
		[
			getTopicReview,
			isTopicAdded,
			isReviewCompleted,
			switchToTopic,
			openTopicDetail,
			updateRating,
			removeTopicFromReview,
			addTopicToReview,
			hasQuery,
			searchQuery
		]
	)

	const renderSearchResultItem = useCallback(
		(topic: Topic) => renderAddTopicCard(topic),
		[renderAddTopicCard]
	)

	const renderPopoverTopicCard = useCallback(
		(topicReview: TopicReview) => (
			<ReviewTopicCard
				minHeight={MIN_HEIGHT}
				onRemoveFromReview={removeTopicReview}
				onTopicClick={openPopoverAndSelectTopic}
				rating={topicReview.rating}
				topic={topicReview.topic}
				topicReviewId={topicReview.id}
			/>
		),
		[removeTopicReview, openPopoverAndSelectTopic]
	)

	// Derived Values for Render
	const showSearchView =
		viewMode === 'search' || (viewMode === 'detail' && isTopicMinimized)

	const showFloatingCard =
		viewMode === 'detail' && isTopicMinimized && selectedTopic

	const selectedTopicDisplayName = useMemo(() => {
		if (!selectedTopic) return 'Untitled Topic'
		return selectedTopic.name || selectedTopic.notes || 'Untitled Topic'
	}, [selectedTopic])

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className='-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 flex h-[600px] w-full max-w-[90vw] flex-col p-0 md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1100px] 2xl:max-w-[1200px]'
				showCloseButton={false}
			>
				{/* Header */}
				<DialogHeader className='flex-shrink-0 px-4 pt-4'>
					<DialogTitle className='sr-only'>Add Topic to Review</DialogTitle>
					<div className='flex items-center gap-4'>
						{/* Added Topics Popover */}
						<AddedTopicsPopover
							addedTopicsCount={addedTopicsCount}
							estimateItemSize={tr => {
								const topic = tr.topic
								const nameLines = Math.ceil((topic.name?.length || 8) / 40)
								const notesLines = topic.notes
									? Math.min(2, Math.ceil(topic.notes.length / 40))
									: 0
								return Math.max(
									MIN_HEIGHT,
									72 + (nameLines - 1) * 20 + notesLines * 20
								)
							}}
							getItemKey={tr => tr.id}
							isOpen={isPopoverOpen}
							onOpenChange={setIsPopoverOpen}
							renderItem={renderPopoverTopicCard}
							topicReviews={review?.topic_reviews}
						/>

						{/* Search Input */}
						<SearchInput
							inputRef={inputRef}
							onChange={handleSearchChange}
							onClear={clearSearch}
							onFocus={handleSearchFocus}
							value={searchQuery}
						/>

						{/* Action Buttons */}
						<Button
							disabled={isCreatingTopicReview}
							onClick={createNewTopic}
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

				{/* Content */}
				<div className='scrollbar-track-transparent flex-1 overflow-y-auto p-4 pt-0'>
					<AnimatePresence initial={false} mode='wait'>
						{showSearchView ? (
							<SearchResultsContainer
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
								hasQuery={hasQuery}
								isLoading={isSearching}
								renderItem={renderSearchResultItem}
								results={searchResults}
								searchQuery={searchQuery}
							/>
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
											<ReviewTopicDetail
												isAdded={selectedTopicIsAdded}
												isLoading={isLoadingTopic}
												isReviewCompleted={isReviewCompleted}
												onAddToReview={addTopicToReview}
												onClose={closeTopicDetail}
												onMinimize={minimizeTopicDetail}
												onNestedTopicCreated={handleNestedTopicCreated}
												onRatingChange={updateRating}
												onRemoveFromReview={removeTopicFromReview}
												onTopicDeleted={handleTopicDeleted}
												onTopicSwitch={switchToTopic}
												renderChildCard={renderAddTopicCard}
												topic={selectedTopic}
												topicReview={selectedTopicReview}
											/>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Floating Card for Minimized State */}
				<AnimatePresence mode='wait'>
					{showFloatingCard && (
						<motion.div
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							key='floating-card-content'
							transition={{
								opacity: { duration: 0.15, delay: 0.15 }
							}}
						>
							<FloatingTopicCard
								displayName={selectedTopicDisplayName}
								onClose={closeTopicDetail}
								onMaximize={maximizeTopicDetail}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</DialogContent>
		</Dialog>
	)
}
