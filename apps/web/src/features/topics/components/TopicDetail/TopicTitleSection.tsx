import type { ChangeEvent } from 'react'
import { LearnableTitleSection } from '~/components/LearnableTitleSection'
import type { OnConversionSuccess } from '~/hooks/useConversionNavigate'
import type { Topic } from '../../types/topic.types'
import { TopicActionMenu } from '../TopicActionMenu'

interface TopicTitleSectionProps {
	title: string
	onTitleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
	topic: Topic
	onSrsToggle: (pressed: boolean) => void
	isUpdating: boolean
	sidebarReadonly: boolean
	onConvertSuccess?: OnConversionSuccess
	onDelete?: () => void | Promise<void>
	onTopicUpdateSuccess: (topic: Topic) => void
}

export function TopicTitleSection({
	title,
	onTitleChange,
	topic,
	onSrsToggle,
	isUpdating,
	sidebarReadonly,
	onConvertSuccess,
	onDelete,
	onTopicUpdateSuccess
}: TopicTitleSectionProps) {
	return (
		<LearnableTitleSection
			entity={topic}
			isUpdating={isUpdating}
			onSrsToggle={onSrsToggle}
			onTitleChange={onTitleChange}
			renderActionMenu={trigger => (
				<TopicActionMenu
					onConvertSuccess={onConvertSuccess}
					onDelete={onDelete}
					onTopicUpdateSuccess={onTopicUpdateSuccess}
					topic={topic}
					trigger={trigger}
				/>
			)}
			sidebarReadonly={sidebarReadonly}
			title={title}
		/>
	)
}
