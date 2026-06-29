import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import { BreadcrumbLink } from '~/components/ui/breadcrumb'
import { TOPIC_DETAIL_INTENT_PRELOAD_DELAY } from '~/modules/topics/hooks/usePrefetchTopicDetail'

import { TopicBreadcrumb, type TopicPathItem } from './TopicBreadcrumb'
import { TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID } from './topicDetailStructure'

export type { TopicPathItem } from './TopicBreadcrumb'

const LIBRARY_TOPIC_PATH_ITEM: TopicPathItem = {
	id: TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID,
	title: 'Library',
	body: '',
}

interface TopicDetailBreadcrumbProps {
	className?: string
	currentTopicId: number
	topicPath: Array<TopicPathItem>
}

export function TopicDetailBreadcrumb({
	className,
	currentTopicId,
	topicPath,
}: TopicDetailBreadcrumbProps) {
	const navigate = useNavigate()
	const breadcrumbTopicPath = useMemo(
		() => [LIBRARY_TOPIC_PATH_ITEM, ...topicPath],
		[topicPath],
	)

	return (
		<TopicBreadcrumb
			ariaLabel='Topic path'
			className={className}
			currentTopicId={currentTopicId}
			onHiddenTopicSelect={topic => {
				void navigate(
					topic.id === TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID
						? { to: '/library' }
						: {
								to: '/topics/$topicId',
								params: { topicId: topic.id.toString() },
							},
				)
			}}
			renderTopicLink={({ className: linkClassName, label, topic }) => {
				const linkElement =
					topic.id === TOPIC_DETAIL_SYNTHETIC_LIBRARY_ROOT_ID ? (
						<Link to='/library' />
					) : (
						<Link
							params={{ topicId: topic.id.toString() }}
							preload='intent'
							preloadDelay={TOPIC_DETAIL_INTENT_PRELOAD_DELAY}
							to='/topics/$topicId'
						/>
					)

				return (
					<BreadcrumbLink
						className={linkClassName}
						render={linkElement}
						title={label}
					>
						{label}
					</BreadcrumbLink>
				)
			}}
			topicPath={breadcrumbTopicPath}
		/>
	)
}
