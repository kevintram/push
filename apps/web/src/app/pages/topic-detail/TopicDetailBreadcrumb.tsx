import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Fragment } from 'react'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from '~/components/ui/breadcrumb'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import { TOPIC_DETAIL_INTENT_PRELOAD_DELAY } from '~/features/topics/hooks/usePrefetchTopicDetail'
import { getTopicDisplayTitle } from '~/features/topics/utils/topicTree'
import { formatRelativeDate } from '~/utils/formatRelativeDate'

type TopicMeta = {
	id: number
	inserted_at: string
	updated_at: string
}

type TopicPathItem = {
	id: number
	title: string
	body: string
}

export function TopicDetailBreadcrumb({
	onTitleChange,
	onTitleBlur,
	title,
	titleTextareaRef,
	topic,
	topicPath
}: {
	onTitleBlur: () => void
	onTitleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
	title: string
	titleTextareaRef: React.RefObject<HTMLTextAreaElement | null>
	topic: TopicMeta
	topicPath: Array<TopicPathItem>
}) {
	return (
		<div className='min-w-0 space-y-2'>
			<Breadcrumb aria-label='Topic path'>
				<BreadcrumbList>
					{topicPath.map((pathTopic, index) => {
						const label = getTopicDisplayTitle(pathTopic.title, pathTopic.body)
						const isCurrentTopic = index === topicPath.length - 1

						return (
							<Fragment key={pathTopic.id}>
								{index > 0 ? <BreadcrumbSeparator /> : null}
								<BreadcrumbItem className='min-w-0'>
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
							</Fragment>
						)
					})}
				</BreadcrumbList>
			</Breadcrumb>
			<Textarea
				aria-label='Topic title'
				className='!bg-transparent !text-3xl m-0 min-h-0 resize-none overflow-hidden break-words rounded-none border-none p-0 pb-1 font-bold leading-tight shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
				onBlur={onTitleBlur}
				onChange={onTitleChange}
				placeholder='Untitled topic'
				ref={titleTextareaRef}
				spellCheck={false}
				value={title}
			/>

			<div className='flex flex-wrap items-center gap-2 font-semibold text-muted-foreground text-sm'>
				<Tooltip>
					<TooltipTrigger
						render={<span>{`Edited ${formatRelativeDate(topic.updated_at).text}`}</span>}
					/>
					<TooltipContent>
						{dayjs(topic.updated_at).format('MMM D, YYYY')}
					</TooltipContent>
				</Tooltip>
				<span aria-hidden={true}>·</span>
				<Tooltip>
					<TooltipTrigger
						render={<span>{`Created ${formatRelativeDate(topic.inserted_at).text}`}</span>}
					/>
					<TooltipContent>
						{dayjs(topic.inserted_at).format('MMM D, YYYY')}
					</TooltipContent>
				</Tooltip>
			</div>
		</div>
	)
}
