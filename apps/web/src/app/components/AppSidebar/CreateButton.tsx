// React

// External libraries
import { useNavigate } from '@tanstack/react-router'
import { FileText, Plus, SquarePen } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// UI Components
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { SidebarMenuButton } from '~/components/ui/sidebar'

// Feature hooks
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'

export function CreateButton() {
	// Hooks
	const navigate = useNavigate()

	// State for AddTopicDialog
	const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false)
	// State for AddSourceDialog
	const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false)
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<SidebarMenuButton
						className='bg-primary text-primary-foreground hover:bg-primary/90'
						tooltip='Create new...'
					>
						<Plus className='' />
						<span>Create</span>
					</SidebarMenuButton>
				}
			/>
			<DropdownMenuContent align='start' className='min-w-56' side='right'>
				<DropdownMenuItem
					className='py-2'
					onClick={() => setIsAddTopicDialogOpen(true)}
				>
					<SquarePen />
					<span>Topic</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className='py-2'
					onClick={() => setIsAddSourceDialogOpen(true)}
				>
					<FileText />
					<div className='flex flex-col'>
						<span>Source</span>
						<span className='text-muted-foreground text-xs'>
							Books, articles, lectures, videos, etc.
						</span>
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>

			<AddTopicDialog
				onOpenChange={setIsAddTopicDialogOpen}
				onSuccess={topicId => {
					toast('Topic created', {
						action: {
							label: 'Open',
							onClick: () =>
								navigate({
									to: '/topics/$topicId',
									params: { topicId: topicId.toString() }
								})
						}
					})
				}}
				open={isAddTopicDialogOpen}
				relationship={{ kind: 'standalone' }}
			/>

			<AddSourceDialog
				onOpenChange={setIsAddSourceDialogOpen}
				onSuccess={sourceId => {
					toast('Source created', {
						action: {
							label: 'Open',
							onClick: () =>
								navigate({
									to: '/sources/$sourceId',
									params: { sourceId: sourceId.toString() }
								})
						}
					})
				}}
				open={isAddSourceDialogOpen}
				relationship={{ kind: 'standalone' }}
			/>
		</DropdownMenu>
	)
}
