import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Archive, ArchiveX, Inbox, X } from 'lucide-react'
import { type ReactNode, use, useCallback, useEffect, useRef } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import type { Topic } from '~/models/review-topic.types'
import { invalidateTopicsAndReviews } from '~/utils/invalidateTopicsAndReviews'
import { deleteTopic as deleteTopicApi } from '../../api/deleteTopic'
import { updateTopic as updateTopicApi } from '../../api/updateTopic'
import { TopicContext } from '../../stores/SelectedTopicContext'
import { ReviewsSidebar } from '../ReviewsSidebar'
import { TopicChildrenPanel } from '../TopicChildrenPanel'
import { TopicDetailHeader } from './TopicDetailHeader'
import { TopicDetailSkeleton } from './TopicDetailSkeleton'

interface TopicDetailProps {
	/**
	 * The topic to display. If not provided, reads from TopicContext.
	 */
	topic?: Topic | null
	/**
	 * Loading state. If not provided, reads from TopicContext.
	 */
	isLoading?: boolean
	/**
	 * Content to render before the "more" dropdown in the header.
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render after the "more" dropdown in the header.
	 */
	headerAfterActions?: ReactNode
	/**
	 * Whether the sidebar should be readonly. Defaults to false.
	 */
	sidebarReadonly?: boolean
	/**
	 * Callback when the topic is deleted.
	 */
	onDelete?: () => void | Promise<void>
	/**
	 * Callback when navigating to another topic (parent/child click).
	 * If not provided, uses default dialog behavior.
	 */
	onTopicNavigate?: (topicId: number) => void
	/**
	 * Custom card renderer for children panel.
	 */
	renderChildCard?: (
		topic: Topic,
		onRemove: () => void,
		onClick: () => void
	) => ReactNode
}

export function TopicDetail({
	topic: topicProp,
	isLoading: isLoadingProp,
	headerBeforeActions,
	headerAfterActions,
	sidebarReadonly = false,
	onDelete,
	onTopicNavigate,
	renderChildCard
}: TopicDetailProps) {
	// Get topic from context if not provided via props
	const contextValue = use(TopicContext)
	const topic = topicProp !== undefined ? topicProp : contextValue.topic
	const isLoading =
		isLoadingProp !== undefined ? isLoadingProp : contextValue.isLoading

	const queryClient = useQueryClient()

	const { mutateAsync: updateTopicMutation } = useMutation({
		mutationFn: updateTopicApi,
		onSuccess: async () => {
			await invalidateTopicsAndReviews(queryClient)
		}
	})

	const { mutateAsync: deleteTopic } = useMutation({
		mutationFn: deleteTopicApi,
		onSuccess: () => {
			onDelete?.()
			queryClient.invalidateQueries({ queryKey: ['topics'] })
			queryClient.invalidateQueries({ queryKey: ['reviews'] })
		}
	})

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

	// focus on notes whenever selected topic changes
	useEffect(() => {
		if (notesRef.current && topic?.id) {
			notesRef.current.focus()
		}
	}, [topic?.id])

	if (isLoading || !topic) {
		return <TopicDetailSkeleton />
	}

	return (
		<SidebarProvider defaultOpen={true} enableKeyboardShortcut={false}>
			<div className='flex h-full min-h-0 flex-col'>
				<TopicDetailHeader
					afterActions={headerAfterActions}
					beforeActions={headerBeforeActions}
					onArchiveToggle={handleArchiveToggle}
					onDelete={handleDelete}
					onInboxToggle={handleInboxToggle}
					onParentSelect={onTopicNavigate}
					topic={topic}
				/>
				<SidebarHolder className='flex min-h-0 flex-1'>
					<div
						className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll px-6 py-4'
						ref={scrollContainerRef}
					>
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
						<TopicChildrenPanel
							getScrollElement={() => scrollContainerRef.current}
							onChildSelect={onTopicNavigate}
							renderCard={renderChildCard}
							topicId={topic.id}
						/>
					</div>
					<ReviewsSidebar readonly={sidebarReadonly} />
				</SidebarHolder>
			</div>
		</SidebarProvider>
	)
}
