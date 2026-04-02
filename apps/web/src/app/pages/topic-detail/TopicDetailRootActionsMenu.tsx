import { Loader, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

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
	onCreateSubtopic: () => Promise<void>
	onOpenDeleteDialog: () => void
	topicTitle: string
}

export function TopicDetailRootActionsMenu({
	isCreatingTopic,
	onCreateSubtopic,
	onOpenDeleteDialog,
	topicTitle
}: TopicDetailRootActionsMenuProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	return (
		<DropdownMenu
			onOpenChange={nextOpen => {
				if (isSubmitting) return
				setIsOpen(nextOpen)
			}}
			open={isOpen}
		>
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
				<DropdownMenuItem
					closeOnClick={false}
					disabled={isCreatingTopic || isSubmitting}
					onClick={() => {
						setIsSubmitting(true)
						onCreateSubtopic().finally(() => {
							setIsSubmitting(false)
							setIsOpen(false)
						})
					}}
				>
					{isSubmitting ? (
						<>
							<Loader className='h-4 w-4 animate-spin' />
							Creating...
						</>
					) : (
						<>
							<Plus className='h-4 w-4' />
							New topic
						</>
					)}
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
