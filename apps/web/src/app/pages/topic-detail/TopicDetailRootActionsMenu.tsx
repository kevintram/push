import { MoreHorizontal, Plus, Trash2 } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'

type TopicDetailRootActionsMenuProps = {
	isCreatingTopic: boolean
	onCreateSubtopic: () => void
	onOpenDeleteDialog: () => void
	topicTitle: string
}

export function TopicDetailRootActionsMenu({
	isCreatingTopic,
	onCreateSubtopic,
	onOpenDeleteDialog,
	topicTitle
}: TopicDetailRootActionsMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={`More actions for ${topicTitle || 'Untitled topic'}`}
						className='h-8 w-8 shrink-0 rounded-full'
						size='icon-sm'
						variant='outline'
					>
						<MoreHorizontal className='h-4 w-4' />
					</Button>
				}
			/>
			<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
				<DropdownMenuItem disabled={isCreatingTopic} onClick={onCreateSubtopic}>
					<Plus className='mr-2 h-4 w-4' />
					New topic
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={onOpenDeleteDialog} variant='destructive'>
					<Trash2 className='mr-2 h-4 w-4' />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
