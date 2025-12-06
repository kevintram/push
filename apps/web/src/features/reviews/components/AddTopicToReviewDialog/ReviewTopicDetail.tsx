import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
	Archive,
	ArchiveX,
	Inbox,
	Minus,
	MoreHorizontal,
	Trash,
	X
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import { deleteTopic as deleteTopicApi } from '~/features/topics/api/deleteTopic'
import { updateTopic as updateTopicApi } from '~/features/topics/api/updateTopic'
import { TopicDetailSkeleton } from '~/features/topics/components/TopicDetail/TopicDetailSkeleton'
import { ReviewsSidebar } from '~/features/topics/components/TopicPage/ReviewsSidebar'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import type { Rating, Topic } from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { useAddTopicToReview } from './AddTopicToReviewContext'
import { TopicReviewStatusButton } from './ReviewStatusButton'
import { ReviewTopicChildrenPanel } from './ReviewTopicChildrenPanel'
import { ReviewTopicParentsPanel } from './ReviewTopicParentsPanel'

interface ReviewTopicDetailProps {
	// View state callbacks
	onMinimize: () => void
	onClose: () => void
	onTopicDeleted: () => void
	// Navigation
	onTopicSwitch: (topic: Topic) => void
	// Topic creation callback (for creating new related topics)
	onNestedTopicCreated: (topic: Topic) => Promise<void>
}

export function ReviewTopicDetail({
	onMinimize,
	onClose,
	onTopicDeleted,
	onTopicSwitch,
	onNestedTopicCreated
}: ReviewTopicDetailProps) {
	const queryClient = useQueryClient()

	// Get topic and review state from context
	const {
		selectedTopic: topic,
		isLoadingTopic: isLoading,
		isReviewCompleted,
		isSelectedTopicAdded: isTopicAdded,
		selectedTopicReview: topicReview,
		addTopicToReview,
		removeTopicFromReview,
		updateRating
	} = useAddTopicToReview()

	// Topic mutations
	const { mutateAsync: updateTopicMutation } = useMutation({
		mutationFn: updateTopicApi,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const { mutateAsync: deleteTopic } = useMutation({
		mutationFn: deleteTopicApi,
		onSuccess: () => {
			onTopicDeleted()
			queryClient.invalidateQueries({ queryKey: ['topics'] })
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

	// Topic review action handlers
	const handleAddToReview = useCallback(async () => {
		if (!topic) return
		await addTopicToReview(topic)
	}, [topic, addTopicToReview])

	const handleRemoveFromReview = useCallback(async () => {
		if (!topic) return
		await removeTopicFromReview(topic)
	}, [topic, removeTopicFromReview])

	const handleRatingChange = useCallback(
		async (rating: Rating) => {
			if (!topicReview) return
			await updateRating(topicReview.id, rating)
		},
		[topicReview, updateRating]
	)

	// Topic action handlers
	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (topic?.id) {
				updateTopicMutation({ id: topic.id, notes: newNotes })
			}
		},
		[updateTopicMutation, topic?.id]
	)

	const updateNameMutation = useCallback(
		(newTitle: string) => {
			if (!topic) return
			updateTopicMutation({ id: topic.id, name: newTitle })
		},
		[updateTopicMutation, topic]
	)

	const handleDelete = useCallback(async () => {
		if (topic?.id) {
			await deleteTopic(topic.id)
		}
	}, [deleteTopic, topic?.id])

	const handleArchiveToggle = useCallback(async () => {
		if (topic?.id) {
			await updateTopicMutation({
				id: topic.id,
				archived: !topic.archived
			})
		}
	}, [updateTopicMutation, topic?.id, topic?.archived])

	const handleInboxToggle = useCallback(async () => {
		if (topic?.id) {
			await updateTopicMutation({
				id: topic.id,
				inboxed: !topic.inboxed
			})
		}
	}, [updateTopicMutation, topic?.id, topic?.inboxed])

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: topic?.notes ?? '',
		onSave: updateNotesMutation,
		key: `topics-${topic?.id}`
	})

	const { value: title, onChange: onNameChange } = useAutoSave({
		initialValue: topic?.name ?? '',
		onSave: updateNameMutation,
		key: `topics-${topic?.id}`
	})

	const notesRef = useRef<HTMLTextAreaElement | null>(null)
	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

	// Focus on notes whenever selected topic changes
	useEffect(() => {
		if (notesRef.current && topic?.id) {
			notesRef.current.focus()
		}
	}, [topic?.id])

	// Context value for ReviewsSidebar
	const topicContextValue = useMemo(
		() => ({
			topic,
			isLoading
		}),
		[topic, isLoading]
	)

	if (isLoading || !topic) {
		return <TopicDetailSkeleton />
	}

	return (
		<TopicContext value={topicContextValue}>
			<SidebarProvider defaultOpen={true} enableKeyboardShortcut={false}>
				<div className='flex h-full min-h-0 flex-col'>
					{/* Header */}
					<div className='sticky top-0 z-10 w-full border-b'>
						<div className='flex items-center justify-between gap-4 px-2 py-1'>
							<div className='flex min-w-0 flex-1 items-center gap-4'>
								<ReviewTopicParentsPanel
									onNestedTopicCreated={onNestedTopicCreated}
									onParentSelect={onTopicSwitch}
									topic={topic}
								/>
							</div>

							<div className='flex items-center gap-2'>
								{/* Add/Remove topic from review button */}
								<TopicReviewStatusButton
									isAdded={isTopicAdded}
									isReviewCompleted={isReviewCompleted}
									onAdd={handleAddToReview}
									onRatingChange={topicReview ? handleRatingChange : undefined}
									onRemove={handleRemoveFromReview}
									rating={topicReview?.rating}
								/>

								{/* More options dropdown */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild={true}>
										<Button
											className='h-6 w-6 p-0'
											size='sm'
											title='More options'
											variant='ghost'
										>
											<MoreHorizontal className='h-4 w-4' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem onClick={handleArchiveToggle}>
											{topic.archived ? (
												<>
													<ArchiveX className='mr-2 h-4 w-4' />
													Unarchive
												</>
											) : (
												<>
													<Archive className='mr-2 h-4 w-4' />
													Archive
												</>
											)}
										</DropdownMenuItem>
										<DropdownMenuItem onClick={handleInboxToggle}>
											{topic.inboxed ? (
												<>
													<Inbox className='mr-2 h-4 w-4' />
													Remove from Inbox
												</>
											) : (
												<>
													<Inbox className='mr-2 h-4 w-4' />
													Add to Inbox
												</>
											)}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleDelete}
											variant='destructive'
										>
											<Trash className='mr-2 h-4 w-4' />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>

								{/* Minimize button */}
								<Button
									className='h-6 w-6 p-0 text-muted-foreground'
									onClick={onMinimize}
									size='sm'
									title='Minimize'
									variant='ghost'
								>
									<Minus className='h-4 w-4' />
								</Button>

								{/* Close button */}
								<Button
									className='h-6 w-6 p-0 text-muted-foreground'
									onClick={onClose}
									size='sm'
									title='Back to search'
									variant='ghost'
								>
									<X className='h-4 w-4' />
								</Button>
							</div>
						</div>
					</div>

					{/* Content */}
					<SidebarHolder className='flex min-h-0 flex-1'>
						<div
							className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll px-6 py-4'
							ref={scrollContainerRef}
						>
							{/* Status badges */}
							{(topic.archived || topic.inboxed) && (
								<div className='-translate-x-2 flex flex-row'>
									{topic.archived && (
										<Popover>
											<PopoverTrigger asChild={true}>
												<Button
													className='flex items-center'
													size='sm'
													variant='ghost'
												>
													<Archive className='h-4 w-4 text-muted-foreground' />
													<span className='text-muted-foreground text-xs'>
														Archived
													</span>
												</Button>
											</PopoverTrigger>
											<PopoverContent className='w-auto p-2'>
												<Button
													className='w-full justify-start'
													onClick={handleArchiveToggle}
													size='sm'
													variant='ghost'
												>
													<ArchiveX className='mr-2 h-4 w-4' />
													Unarchive
												</Button>
											</PopoverContent>
										</Popover>
									)}
									{topic.inboxed && (
										<Popover>
											<PopoverTrigger asChild={true}>
												<Button
													className='flex items-center'
													size='sm'
													variant='ghost'
												>
													<Inbox className='h-4 w-4 text-muted-foreground' />
													<span className='text-muted-foreground text-xs'>
														Inboxed
													</span>
												</Button>
											</PopoverTrigger>
											<PopoverContent className='w-auto p-2'>
												<Button
													className='w-full justify-start'
													onClick={handleInboxToggle}
													size='sm'
													variant='ghost'
												>
													<X className='mr-2 h-4 w-4' />
													Remove from inbox
												</Button>
											</PopoverContent>
										</Popover>
									)}
								</div>
							)}

							{/* Title and Notes */}
							<div className='pb-4'>
								<Textarea
									className='!bg-transparent break-word !text-xl m-0 min-h-0 w-full max-w-2xl resize-none overflow-hidden rounded-none border-none p-0 font-semibold focus:outline-none focus-visible:border-none focus-visible:ring-0'
									onChange={onNameChange}
									placeholder='Title'
									spellCheck={false}
									value={title}
								/>
								<Textarea
									className='!bg-transparent m-0 w-full max-w-2xl resize-none overflow-hidden rounded-none border-none p-0 shadow-none focus-visible:border-none focus-visible:ring-0'
									name='notes'
									onChange={onNotesChange}
									placeholder='Notes'
									ref={notesRef}
									value={notes}
								/>
							</div>

							{/* Children */}
							<ReviewTopicChildrenPanel
								getScrollElement={() => scrollContainerRef.current}
								onNestedTopicCreated={onNestedTopicCreated}
								onTopicSwitch={onTopicSwitch}
								topic={topic}
							/>
						</div>
						<ReviewsSidebar readonly={true} />
					</SidebarHolder>
				</div>
			</SidebarProvider>
		</TopicContext>
	)
}
