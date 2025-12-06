import { useQuery } from '@tanstack/react-query'
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
import { searchTopics } from '~/features/topics/api/searchTopics'
import { useDebouncedValue } from '~/hooks/useDebouncedValue'
import type { Topic } from '~/models/review-topic.types'
import { AddedTopicsPopover } from './AddedTopicsPopover'
import { AddTopicCard } from './AddTopicCard'
import {
	AddTopicToReviewProvider,
	useAddTopicToReview
} from './AddTopicToReviewContext'
import { FloatingTopicCard } from './FloatingTopicCard'
import { ReviewTopicDetail } from './TopicDetail/TopicDetail'

// Constants
const MIN_HEIGHT = 72

// Types
interface AddTopicToReviewDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	review: Review | undefined
}

type ViewMode = 'search' | 'detail'

// Inner component that uses the context
function AddTopicToReviewDialogContent({
	open,
	onOpenChange
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const inputRef = useRef<HTMLInputElement>(null)

	// Get shared state from context
	const {
		review,
		selectedTopicId,
		setSelectedTopicId,
		addTopicToReview: createTopicReview,
		isCreatingTopicReview
	} = useAddTopicToReview()

	// Local view state
	const [searchQuery, setSearchQuery] = useState('')
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const [viewMode, setViewMode] = useState<ViewMode>('search')
	const [isTopicMinimized, setIsTopicMinimized] = useState(false)

	// Search
	const debouncedQuery = useDebouncedValue(searchQuery, 300)
	const hasQuery = Boolean(debouncedQuery.trim())

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
	}, [open, setSelectedTopicId])

	// Topic Creation
	const onCreateNewClicked = useCallback(async () => {
		if (!review) return

		try {
			const trimmedQuery = searchQuery.trim()

			const topicReview = await createTopicReview({
				topic: {
					name: '',
					notes: trimmedQuery || '',
					archived: false,
					inboxed: true
				}
			})

			setSelectedTopicId(topicReview.topic_id)
			setViewMode('detail')
		} catch {
			// Error handling could be added here if needed
		}
	}, [searchQuery, review, createTopicReview, setSelectedTopicId])

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
		[selectedTopicId, isTopicMinimized, viewMode, setSelectedTopicId]
	)

	const openTopic = useCallback(
		(topicId: number) => {
			setSelectedTopicId(topicId)
			setViewMode('detail')
			setIsTopicMinimized(false)
		},
		[setSelectedTopicId]
	)

	const closeTopicDetail = useCallback(() => {
		setViewMode('search')
		setIsTopicMinimized(false)
		setTimeout(() => setSelectedTopicId(undefined), 200)
	}, [setSelectedTopicId])

	const handleTopicDeleted = useCallback(() => {
		setViewMode('search')
		setIsTopicMinimized(false)
		setSelectedTopicId(undefined)
	}, [setSelectedTopicId])

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

	// Popover Handlers
	const closePopoverAndSelectTopic = useCallback(
		(topic: Topic) => {
			setSelectedTopicId(topic.id)
			setViewMode('detail')
			setIsPopoverOpen(false)
		},
		[setSelectedTopicId]
	)

	// Derived Values for Render
	const showSearchView =
		viewMode === 'search' || (viewMode === 'detail' && isTopicMinimized)

	const showFloatingCard =
		viewMode === 'detail' && isTopicMinimized && selectedTopicId !== undefined

	return (
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
						isOpen={isPopoverOpen}
						onOpenChange={setIsPopoverOpen}
						onTopicClick={closePopoverAndSelectTopic}
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
						onClick={onCreateNewClicked}
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
							renderItem={topic => (
								<AddTopicCard
									onCardClick={openTopicDetail}
									searchQuery={hasQuery ? searchQuery : ''}
									topic={topic}
								/>
							)}
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
											onClose={closeTopicDetail}
											onMinimize={minimizeTopicDetail}
											onTopicDeleted={handleTopicDeleted}
											onTopicSelected={openTopic}
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
							onClose={closeTopicDetail}
							onMaximize={maximizeTopicDetail}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</DialogContent>
	)
}

// Main Component with Provider wrapper
export function AddTopicToReviewDialog({
	open,
	onOpenChange,
	review
}: AddTopicToReviewDialogProps) {
	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<AddTopicToReviewProvider review={review}>
				<AddTopicToReviewDialogContent
					onOpenChange={onOpenChange}
					open={open}
				/>
			</AddTopicToReviewProvider>
		</Dialog>
	)
}
