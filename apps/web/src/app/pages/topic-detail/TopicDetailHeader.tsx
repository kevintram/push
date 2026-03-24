import { MoreHorizontal, Trash2 } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { TopicNavigatorSheet } from '~/features/topics/components/topic-navigator/TopicNavigator'

export function TopicDetailHeader({
	activeTopicId,
	onOpenDeleteDialog
}: {
	activeTopicId: number
	onOpenDeleteDialog: () => void
}) {
	return (
		<div className='sticky top-0 z-10 flex w-full items-center justify-end px-2 py-1'>
			<div className='flex items-center justify-end gap-2'>
				<TopicNavigatorSheet activeTopicId={activeTopicId} />
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button size='icon-sm' type='button' variant='ghost'>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						}
					/>
					<DropdownMenuContent align='end' side='bottom' sideOffset={4}>
						<DropdownMenuItem
							onClick={onOpenDeleteDialog}
							variant='destructive'
						>
							<Trash2 className='mr-2 h-4 w-4' />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}
