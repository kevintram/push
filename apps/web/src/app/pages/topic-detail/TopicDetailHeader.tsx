import { Link } from '@tanstack/react-router'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from '~/components/ui/breadcrumb'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Textarea } from '~/components/ui/textarea'
import { useUpdateTopic } from '~/features/topics/api/updateTopic'
import { TOPIC_DETAIL_INTENT_PRELOAD_DELAY } from '~/features/topics/hooks/usePrefetchTopicDetail'
import type { Topic } from '~/features/topics/types/topic.types'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { useAutoSave } from '~/hooks/useAutoSave'
import { cn } from '~/lib/utils'
import {
	formatAbsoluteDate,
	formatRelativeDate
} from '~/utils/formatRelativeDate'
import { TopicDetailSectionMeta } from './TopicDetailSectionMeta'

type TopicPathItem = {
	id: number
	title: string
	body: string
}

interface TopicDetailHeaderProps {
	actionClassName?: string
	contentClassName?: string
	onOpenDeleteDialog: () => void
	shouldAutoFocusTitle?: boolean
	titleContainerClassName?: string
	topic: Topic
	topicPath: Array<TopicPathItem>
}

export function TopicDetailHeader({
	actionClassName,
	contentClassName,
	onOpenDeleteDialog,
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

	return (
		<div className='relative min-w-0'>
			<div className={cn('min-w-0 space-y-1', contentClassName)}>
				{topicPath.length > 1 ? (
					<Breadcrumb aria-label='Topic path'>
						<BreadcrumbList>
							{topicPath.map((pathTopic, index) => {
								const label = getTopicDisplayTitle(
									pathTopic.title,
									pathTopic.body
								)
								const isCurrentTopic = index === topicPath.length - 1

								return [
									index > 0 ? (
										<BreadcrumbSeparator key={`separator-${pathTopic.id}`} />
									) : null,
									<BreadcrumbItem className='min-w-0' key={pathTopic.id}>
										{isCurrentTopic ? (
											<BreadcrumbPage className='truncate font-medium'>
												{label}
											</BreadcrumbPage>
										) : (
											<BreadcrumbLink
												className='truncate'
												render={
													<Link
														params={{ topicId: pathTopic.id.toString() }}
														preload='intent'
														preloadDelay={TOPIC_DETAIL_INTENT_PRELOAD_DELAY}
														to='/topics/$topicId'
													/>
												}
											>
												{label}
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
								]
							})}
						</BreadcrumbList>
					</Breadcrumb>
				) : null}
				<div className='space-y-2.5'>
					<div
						className={cn('min-w-0 pr-12 sm:pr-14', titleContainerClassName)}
					>
						<Textarea
							aria-label='Topic title'
							className='!bg-transparent !text-[1.875rem] sm:!text-[2.125rem] xl:!text-[2.375rem] m-0 min-h-0 w-full resize-none overflow-hidden break-words rounded-none border-none px-0 pt-0 pb-1 font-semibold leading-[1.08] tracking-[-0.025em] shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
							onBlur={flushTitle}
							onChange={onTitleChange}
							placeholder='Untitled topic'
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
			</div>
			<div className={cn('absolute top-1 right-0', actionClassName)}>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label={`More actions for ${topic.title || 'Untitled topic'}`}
								className='h-8 w-8 shrink-0'
								size='icon-sm'
								variant='outline'
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
			</div>
		</div>
	)
}
