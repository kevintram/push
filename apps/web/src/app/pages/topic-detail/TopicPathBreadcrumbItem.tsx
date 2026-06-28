import { type ReactNode } from 'react'

import { BreadcrumbItem, BreadcrumbPage } from '~/components/ui/breadcrumb'
import { cn } from '~/lib/utils'
import { getTopicDisplayTitle } from '~/modules/topics/utils/topicTree'

import { type TopicPathItem } from './TopicBreadcrumb'

type TopicPathBreadcrumbItemProps = {
	currentTopicId: number
	renderTopicLink: (args: {
		className: string
		label: string
		topic: TopicPathItem
	}) => ReactNode
	topic: TopicPathItem
}

export function TopicPathBreadcrumbItem({
	currentTopicId,
	renderTopicLink,
	topic,
}: TopicPathBreadcrumbItemProps) {
	const label = getTopicDisplayTitle(topic.title, topic.body)
	const isCurrentTopic = topic.id === currentTopicId

	return (
		<BreadcrumbItem
			className={cn(
				isCurrentTopic
					? 'min-w-0 flex-[1_1_7rem] overflow-hidden'
					: 'min-w-0',
			)}
		>
			{isCurrentTopic ? (
				<BreadcrumbPage
					className='block truncate font-medium'
					title={label}
				>
					{label}
				</BreadcrumbPage>
			) : (
				renderTopicLink({
					className:
						'block @[300px]/crumbs:max-w-[6.5rem] @[380px]/crumbs:max-w-[7.5rem] @[460px]/crumbs:max-w-36 @[560px]/crumbs:max-w-40 max-w-20 truncate',
					label,
					topic,
				})
			)}
		</BreadcrumbItem>
	)
}
