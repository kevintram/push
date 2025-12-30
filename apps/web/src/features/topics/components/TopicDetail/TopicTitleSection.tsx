import { BookOpen, MoreHorizontal } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { BookOpenOff } from '~/components/icons'
import { Button } from '~/components/ui/Button'
import { Textarea } from '~/components/ui/Textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { Topic } from '../../types/topic.types'
import { TopicActionMenu } from '../TopicActionMenu'

interface TopicTitleSectionProps {
	title: string
	onTitleChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
	topic: Topic
	onSrsToggle: (pressed: boolean) => void
	isUpdating: boolean
	sidebarReadonly: boolean
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
	onDelete,
	onTopicUpdateSuccess
}: TopicTitleSectionProps) {
	return (
		<div className='flex items-start gap-2'>
			<Textarea
				className='!mt-0.5 !bg-transparent break-word !text-xl m-0 min-h-0 flex-1 resize-none overflow-hidden rounded-none border-none p-0 font-extrabold shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
				onChange={onTitleChange}
				placeholder='Title'
				spellCheck={false}
				value={title}
			/>
			<div className='flex items-center gap-2'>
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<Button
							disabled={isUpdating || sidebarReadonly}
							onClick={() => onSrsToggle(!(topic.srs_enabled ?? true))}
							size='icon-sm'
							variant='outline'
						>
							{(topic.srs_enabled ?? true) ? (
								<BookOpen className='h-5 w-5 text-green-500' />
							) : (
								<BookOpenOff className='h-5 w-5 text-muted-foreground' />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side='bottom'>Surface in review page</TooltipContent>
				</Tooltip>
				<TopicActionMenu
					onDelete={onDelete}
					onTopicUpdateSuccess={onTopicUpdateSuccess}
					topic={topic}
					trigger={
						<Button size='icon-sm' title='More options' variant='outline'>
							<MoreHorizontal className='h-5 w-5' />
						</Button>
					}
				/>
			</div>
		</div>
	)
}
