import { ScrollArea } from '~/components/ui/scroll-area'
import { useSidebar } from '~/components/ui/sidebar'
import { TopicNavigator } from '~/modules/topics/components/topic-navigator/TopicNavigator'
import { useActiveTopicNavigatorTopicId } from '~/modules/topics/components/topic-navigator/useActiveTopicNavigatorTopicId'

export function SidebarTopicTree({
	onCollapseAllReady,
}: {
	onCollapseAllReady?: (collapseAll: () => void) => void
}) {
	const { isMobile, state } = useSidebar()
	const activeTopicId = useActiveTopicNavigatorTopicId()
	const shouldRenderTree = isMobile || state === 'expanded'

	if (!shouldRenderTree) return null

	return (
		<div className='min-h-0 flex-1 border-sidebar-border/70 pr-0.5 pb-1.5 pl-1.5'>
			<ScrollArea
				className='h-full min-h-0 flex-1'
				scrollbarClassName='p-px data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5'
			>
				<div className='px-1 pb-1.5'>
					<TopicNavigator
						activeTopicId={activeTopicId}
						autoScrollActiveTopic={true}
						enableDragAndDrop={!isMobile}
						onCollapseAllReady={onCollapseAllReady}
					/>
				</div>
			</ScrollArea>
		</div>
	)
}
