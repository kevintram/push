import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { BreadcrumbLink } from '~/components/ui/breadcrumb'
import { TOPIC_DETAIL_INTENT_PRELOAD_DELAY } from '~/features/topics/hooks/usePrefetchTopicDetail'
import { TopicBreadcrumb, type TopicPathItem } from './TopicBreadcrumb'
import { getTopicDetailSectionId } from './topicDetailStructure'

export type { TopicPathItem } from './TopicBreadcrumb'

interface TopicDetailBreadcrumbProps {
	className?: string
	currentTopicId: number
	topicPath: Array<TopicPathItem>
}

export function TopicDetailBreadcrumb({
	className,
	currentTopicId,
	topicPath
}: TopicDetailBreadcrumbProps) {
	const navigate = useNavigate()

	return (
		<TopicBreadcrumb
			ariaLabel='Topic path'
			className={className}
			currentTopicId={currentTopicId}
			onHiddenTopicSelect={topic => {
				void navigate({
					to: '/topics/$topicId',
					params: { topicId: topic.id.toString() }
				})
			}}
			renderTopicLink={({ className: linkClassName, label, topic }) => (
				<BreadcrumbLink
					className={linkClassName}
					render={
						<Link
							params={{ topicId: topic.id.toString() }}
							preload='intent'
							preloadDelay={TOPIC_DETAIL_INTENT_PRELOAD_DELAY}
							to='/topics/$topicId'
						/>
					}
					title={label}
				>
					{label}
				</BreadcrumbLink>
			)}
			topicPath={topicPath}
		/>
	)
}

interface TopicDetailSectionBreadcrumbProps {
	className?: string
	currentTopicId: number
	rootTopicId: number
	rootTopicPath: Array<TopicPathItem>
	topicPath: Array<TopicPathItem>
}

export function TopicDetailSectionBreadcrumb({
	className,
	currentTopicId,
	rootTopicId,
	rootTopicPath,
	topicPath
}: TopicDetailSectionBreadcrumbProps) {
	const navigate = useNavigate()
	const inDocumentTopicIds = useMemo(
		() => new Set(topicPath.map(topic => topic.id)),
		[topicPath]
	)

	return (
		<TopicBreadcrumb
			ariaLabel='Section path'
			className={className}
			currentTopicId={currentTopicId}
			leadingHiddenTopics={rootTopicPath}
			onHiddenTopicSelect={topic => {
				if (inDocumentTopicIds.has(topic.id)) {
					void navigate({
						hash: getTopicDetailSectionId(topic.id),
						hashScrollIntoView: false,
						params: { topicId: rootTopicId.toString() },
						resetScroll: false,
						search: true,
						to: '/topics/$topicId'
					})
					return
				}

				void navigate({
					to: '/topics/$topicId',
					params: { topicId: topic.id.toString() }
				})
			}}
			renderTopicLink={({ className: linkClassName, label, topic }) => (
				<BreadcrumbLink
					className={linkClassName}
					render={
						<Link
							hash={getTopicDetailSectionId(topic.id)}
							hashScrollIntoView={false}
							params={{ topicId: rootTopicId.toString() }}
							resetScroll={false}
							search={true}
							to='/topics/$topicId'
						/>
					}
					title={label}
				>
					{label}
				</BreadcrumbLink>
			)}
			topicPath={topicPath.length > 1 ? topicPath.slice(1) : topicPath}
		/>
	)
}
