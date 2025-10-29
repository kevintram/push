import {
	Archive,
	ArchiveRestore,
	Inbox,
	MoreVertical,
	Trash
} from 'lucide-react'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { SidebarTrigger } from '~/components/ui/Sidebar'
import type { Topic } from '~/types/topics.types'
import { TopicParentsPanel } from './FamilyPanel/TopicParentsPanel'

interface TopicPageHeaderProps {
	topic: Topic
	onArchiveToggle: () => void
	onInboxToggle: () => void
	onDelete: () => void
}

export function TopicPageHeader({
	topic,
	onArchiveToggle,
	onInboxToggle,
	onDelete
}: TopicPageHeaderProps) {
	return (
		<div className='sticky top-0 z-10 w-full border-b'>
			<div className='flex items-center justify-between gap-4 px-2 py-1'>
				<div className='flex min-w-0 flex-1 items-center gap-4'>
					<TopicParentsPanel />
				</div>

				<div className='flex items-center gap-2'>
					{topic.archived && (
						<div className='flex items-center'>
							<Archive className='mr-2 h-4 w-4 text-muted-foreground' />
							<span className='text-muted-foreground text-xs'>Archived</span>
						</div>
					)}
					{topic.inboxed && (
						<div className='flex items-center'>
							<Inbox className='mr-2 h-4 w-4 text-muted-foreground' />
							<span className='text-muted-foreground text-xs'>Inbox</span>
						</div>
					)}

					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button
								className='h-6 w-6 p-0'
								size='sm'
								title='More options'
								variant='ghost'
							>
								<MoreVertical className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={onArchiveToggle}>
								{topic.archived ? (
									<>
										<ArchiveRestore className='mr-2 h-4 w-4' />
										Unarchive
									</>
								) : (
									<>
										<Archive className='mr-2 h-4 w-4' />
										Archive
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onInboxToggle}>
								{topic.inboxed ? (
									<>
										<Inbox className='mr-2 h-4 w-4' />
										Remove from Inbox
									</>
								) : (
									<>
										<Inbox className='mr-2 h-4 w-4' />
										Add to Inbox
									</>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onDelete} variant='destructive'>
								<Trash className='mr-2 h-4 w-4' />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<SidebarTrigger />
				</div>
			</div>
		</div>
	)
}
