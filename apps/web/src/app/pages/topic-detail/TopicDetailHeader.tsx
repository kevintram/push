import { TopicNavigatorSheet } from '~/features/topics/components/topic-navigator/TopicNavigator'

export function TopicDetailHeader({
	activeTopicId
}: {
	activeTopicId: number
}) {
	return (
		<div className='flex w-full items-center justify-end md:hidden'>
			<TopicNavigatorSheet activeTopicId={activeTopicId} />
		</div>
	)
}
