import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import type { Topic } from '~/features/topics/types/topic.types'
import { useAutoSave } from '~/hooks/useAutoSave'
import { TopicDetailBreadcrumb } from './TopicDetailBreadcrumb'

type TopicDocumentPageHeaderProps = {
	onOpenDeleteDialog: () => void
	shouldAutoFocusTitle?: boolean
	topic: Topic
	topicPath: Array<{
		id: number
		title: string
		body: string
	}>
}

export function TopicDocumentPageHeader({
	onOpenDeleteDialog,
	shouldAutoFocusTitle = false,
	topic,
	topicPath
}: TopicDocumentPageHeaderProps) {
	const { mutateAsync: updateTopicAsync } = useUpdateTopic()
	const titleTextareaRef = useRef<HTMLTextAreaElement>(null)

	const saveTopicTitle = useCallback(
		async (title: string) => {
			if (title === topic.title) return

			try {
				await updateTopicAsync({ id: topic.id, title })
			} catch {
				toast.error('Failed to update topic')
			}
		},
		[topic.id, topic.title, updateTopicAsync]
	)

	const {
		value: title,
		onChange: onTitleChange,
		flush: flushTitle
	} = useAutoSave({
		initialValue: topic.title,
		onSave: saveTopicTitle,
		key: `topic-document-root-title-${topic.id}`
	})

	useEffect(() => {
		if (!shouldAutoFocusTitle) return

		titleTextareaRef.current?.focus()
	}, [shouldAutoFocusTitle])

	return (
		<TopicDetailBreadcrumb
			onTitleBlur={flushTitle}
			onTitleChange={onTitleChange}
			title={title}
			titleAction={
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label={`More actions for ${topic.title || 'Untitled topic'}`}
								className='h-8 w-8 shrink-0'
								size='icon-sm'
								variant='ghost'
							>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						}
					/>
					<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
						<DropdownMenuItem
							onClick={onOpenDeleteDialog}
							variant='destructive'
						>
							<Trash2 className='mr-2 h-4 w-4' />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			}
			titleTextareaRef={titleTextareaRef}
			topic={topic}
			topicPath={topicPath}
		/>
	)
}
