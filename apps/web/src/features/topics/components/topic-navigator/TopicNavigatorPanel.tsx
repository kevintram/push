import { Link, useNavigate } from '@tanstack/react-router'
import { House, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import { SidebarContent, SidebarHeader } from '~/components/ui/sidebar'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { TopicNavigatorContent } from './TopicNavigatorContent'

type TopicNavigatorPanelProps = {
	activeTopicId?: number | null
	autoScrollActiveTopic?: boolean
	enableDragAndDrop?: boolean
	onNavigate?: () => void
}

export function TopicNavigatorPanel({
	activeTopicId,
	autoScrollActiveTopic = false,
	enableDragAndDrop = false,
	onNavigate
}: TopicNavigatorPanelProps) {
	const navigate = useNavigate()
	const { mutateAsync: createTopicAsync, isPending: isCreatingTopic } =
		useCreateTopic()

	const handleCreateTopic = async () => {
		if (isCreatingTopic) return

		try {
			const created = await createTopicAsync({
				title: '',
				body: ''
			})
			await navigate({
				to: '/topics/$topicId',
				params: { topicId: created.id.toString() },
				search: { focusTitle: true }
			})
			onNavigate?.()
		} catch {
			toast.error('Failed to create topic')
		}
	}

	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<SidebarHeader className='gap-1.5 border-sidebar-border/70 p-1.5'>
				<div className='flex items-center gap-0.5'>
					<Button
						className='flex-1 justify-start'
						nativeButton={false}
						onClick={() => onNavigate?.()}
						render={<Link to='/topics' />}
						size='xs'
						variant='ghost'
					>
						<House />
						Home
					</Button>
					<Button
						aria-label='Create new topic'
						disabled={isCreatingTopic}
						onClick={() => {
							handleCreateTopic().catch(() => {})
						}}
						size='icon-xs'
						variant='ghost'
					>
						<Plus />
					</Button>
				</div>
				<Separator className='mr-10 w-auto!' />
			</SidebarHeader>
			<SidebarContent className='overflow-hidden p-0'>
				<ScrollArea
					className='min-h-0 flex-1'
					scrollbarClassName='p-px data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5'
				>
					<div className='p-1.5'>
						<TopicNavigatorContent
							activeTopicId={activeTopicId}
							autoScrollActiveTopic={autoScrollActiveTopic}
							enableDragAndDrop={enableDragAndDrop}
							onNavigate={onNavigate}
						/>
					</div>
				</ScrollArea>
			</SidebarContent>
		</div>
	)
}
