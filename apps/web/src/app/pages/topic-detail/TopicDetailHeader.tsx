import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { Textarea } from '~/components/ui/textarea'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import type { Topic } from '~/features/topics/types/topic.types'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import {
	TopicDetailBreadcrumb,
	type TopicPathItem
} from './TopicDetailBreadcrumb'
import { TopicDetailRootActionsMenu } from './TopicDetailRootActionsMenu'
import { TopicDetailSectionMeta } from './TopicDetailSectionMeta'
import { TOPIC_DETAIL_SECTION_GRID_CLASS } from './topicDetailLayout'
import { getTopicDetailRootPresentation } from './topicDetailTheme'

interface TopicDetailHeaderProps {
	actionClassName?: string
	contentClassName?: string
	isCreatingTopic: boolean
	onCreateSubtopic: () => Promise<void>
	headingLevel: number
	onOpenDeleteDialog: () => void
	pathContainerClassName?: string
	shouldAutoFocusTitle?: boolean
	titleContainerClassName?: string
	topic: Topic
	topicPath: Array<TopicPathItem>
}

export function TopicDetailHeader({
	actionClassName,
	contentClassName,
	isCreatingTopic,
	onCreateSubtopic,
	headingLevel,
	onOpenDeleteDialog,
	pathContainerClassName,
	shouldAutoFocusTitle = false,
	titleContainerClassName,
	topic,
	topicPath
}: TopicDetailHeaderProps) {
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
	const hasBreadcrumbs = topicPath.length > 1
	const rootPresentation = getTopicDetailRootPresentation()

	return (
		<>
			{hasBreadcrumbs ? (
				<div className={TOPIC_DETAIL_SECTION_GRID_CLASS}>
					<div aria-hidden='true' />
					<div className='min-w-0'>
						<TopicDetailBreadcrumb
							className={pathContainerClassName}
							currentTopicId={topic.id}
							topicPath={topicPath}
						/>
					</div>
				</div>
			) : null}
			<div className={TOPIC_DETAIL_SECTION_GRID_CLASS}>
				<div aria-hidden='true' />
				<div className='relative min-w-0'>
					<div className={cn('min-w-0 space-y-2', contentClassName)}>
						<div
							aria-level={headingLevel}
							className={cn('min-w-0 pr-12 sm:pr-14', titleContainerClassName)}
							role='heading'
						>
							<Textarea
								aria-label='Topic title'
								className={cn(
									'!bg-transparent m-0 min-h-0 w-full resize-none overflow-hidden break-words rounded-none border-none px-0 pt-0 pb-1 shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0',
									rootPresentation.rootTitleClassName
								)}
								onBlur={flushTitle}
								onChange={onTitleChange}
								placeholder='Title'
								ref={titleTextareaRef}
								spellCheck={false}
								value={title}
							/>
						</div>
						<div>
							<TopicDetailSectionMeta
								createdDate={formatAbsoluteDate(topic.inserted_at)}
								createdText={formatRelativeDate(topic.inserted_at).text}
								updatedDate={formatAbsoluteDate(topic.updated_at)}
								updatedText={formatRelativeDate(topic.updated_at).text}
							/>
						</div>
					</div>
					<div className={cn('absolute top-1 right-0', actionClassName)}>
						<TopicDetailRootActionsMenu
							isCreatingTopic={isCreatingTopic}
							onCreateSubtopic={onCreateSubtopic}
							onOpenDeleteDialog={onOpenDeleteDialog}
							topicTitle={topic.title}
						/>
					</div>
				</div>
			</div>
		</>
	)
}
