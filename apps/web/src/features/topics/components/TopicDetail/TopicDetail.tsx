import {
	useDeleteMutation,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SidebarHolder, SidebarProvider } from '~/components/ui/Sidebar'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
import { useTopicWithRelationships } from '../../hooks/useTopicWithRelationships'
import { TopicContext } from '../../stores/SelectedTopicContext'
import { TopicChildrenPanel } from '../TopicPage/FamilyPanel/TopicChildrenPanel'
import { TimelineSidebar } from '../TopicPage/TimelineSidebar'
import { TopicDetailHeader } from './TopicDetailHeader'
import { TopicDetailSkeleton } from './TopicDetailSkeleton'

interface TopicDetailProps {
	topicId: number | undefined
	onDelete?: () => void | Promise<void>
	onTopicChange?: (topic: Topic) => void
	headerActions?: ReactNode
}

export function TopicDetail({
	topicId,
	onDelete,
	onTopicChange,
	headerActions
}: TopicDetailProps) {
	const { topic: selectedTopic, isLoading } = useTopicWithRelationships(topicId)

	const { mutateAsync: updateTopicMutation } = useUpdateMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	const { mutateAsync: deleteTopic } = useDeleteMutation(
		supabase.from('topics'),
		['id'],
		'*',
		{
			onSuccess: async () => {
				if (onDelete) {
					await onDelete()
				}
			}
		}
	)

	const updateNotesMutation = useCallback(
		(newNotes: string) => {
			if (selectedTopic?.id) {
				updateTopicMutation({ id: selectedTopic.id, notes: newNotes })
			}
		},
		[updateTopicMutation, selectedTopic?.id]
	)

	const updateNameMutation = useCallback(
		(newTitle: string) => {
			if (!selectedTopic) return
			updateTopicMutation({ id: selectedTopic.id, name: newTitle })
		},
		[updateTopicMutation, selectedTopic]
	)

	const handleDelete = useCallback(async () => {
		if (selectedTopic?.id) {
			await deleteTopic({ id: selectedTopic.id })
		}
	}, [deleteTopic, selectedTopic?.id])

	const handleArchiveToggle = useCallback(async () => {
		if (selectedTopic?.id) {
			await updateTopicMutation({
				id: selectedTopic.id,
				is_archived: !selectedTopic.is_archived
			})
		}
	}, [updateTopicMutation, selectedTopic?.id, selectedTopic?.is_archived])

	const handleInboxToggle = useCallback(async () => {
		if (selectedTopic?.id) {
			await updateTopicMutation({
				id: selectedTopic.id,
				is_inboxed: !selectedTopic.is_inboxed
			})
		}
	}, [updateTopicMutation, selectedTopic?.id, selectedTopic?.is_inboxed])

	const { value: notes, onChange: onNotesChange } = useAutoSave({
		initialValue: selectedTopic?.notes ?? '',
		onSave: updateNotesMutation,
		key: `topics-${selectedTopic?.id}`
	})

	const { value: title, onChange: onNameChange } = useAutoSave({
		initialValue: selectedTopic?.name ?? '',
		onSave: updateNameMutation,
		key: `topics-${selectedTopic?.id}`
	})

	const notesRef = useRef<HTMLTextAreaElement | null>(null)
	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

	// focus on notes whenever selected topic changes
	useEffect(() => {
		if (notesRef.current) {
			notesRef.current.focus()
		}
	}, [selectedTopic?.id])

	const contextValue = useMemo(
		() => ({
			topic: selectedTopic,
			onTopicChange
		}),
		[selectedTopic, onTopicChange]
	)

	if (isLoading || !selectedTopic) {
		return <TopicDetailSkeleton />
	}

	return (
		<TopicContext value={contextValue}>
			<SidebarProvider defaultOpen={true}>
				<div className='flex h-full min-h-0 flex-col'>
					<TopicDetailHeader
						headerActions={headerActions}
						onArchiveToggle={handleArchiveToggle}
						onDelete={handleDelete}
						onInboxToggle={handleInboxToggle}
						topic={selectedTopic}
					/>
					<SidebarHolder className='flex min-h-0 flex-1'>
						<div
							className='scrollbar-track-transparent min-h-0 w-full overflow-y-scroll px-6 py-4'
							ref={scrollContainerRef}
						>
							<div className='pb-4'>
								<Textarea
									className='!bg-transparent break-word !text-4xl m-0 mb-1 min-h-12 w-full max-w-xl resize-none rounded-none border-none p-0 font-bold focus:outline-none focus-visible:border-none focus-visible:ring-0'
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
							/>
						</div>
						<TimelineSidebar />
					</SidebarHolder>
				</div>
			</SidebarProvider>
		</TopicContext>
	)
}
