import { TopicDialog } from '~/features/topics/components/TopicDialog'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/models/todo-topic.types'

type TopicContextValue = {
	topic?: Topic
	onTopicChange: (topic: Topic) => void
}

type TopicsPageLayoutProps = {
	children: React.ReactNode
	contextValue?: TopicContextValue
	isDialogOpen?: boolean
	onDialogOpenChange?: (open: boolean) => void
}

export function TopicsPageLayout({
	children,
	contextValue,
	isDialogOpen = false,
	onDialogOpenChange
}: TopicsPageLayoutProps) {
	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				{children}
				{contextValue && (
					<TopicContext value={contextValue}>
						<TopicDialog
							onOpenChange={onDialogOpenChange || (() => {})}
							open={isDialogOpen}
						/>
					</TopicContext>
				)}
			</div>
		</div>
	)
}

