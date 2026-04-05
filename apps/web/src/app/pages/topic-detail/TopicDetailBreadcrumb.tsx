import { Link, useNavigate } from '@tanstack/react-router'
import { BreadcrumbLink } from '~/components/ui/breadcrumb'
import { TOPIC_DETAIL_INTENT_PRELOAD_DELAY } from '~/features/topics/hooks/usePrefetchTopicDetail'
import { TopicBreadcrumb, type TopicPathItem } from './TopicBreadcrumb'

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
