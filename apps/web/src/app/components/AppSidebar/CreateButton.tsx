// React

// External libraries
import { useNavigate } from '@tanstack/react-router'
import { Dumbbell, FileText, Plus, SquarePen } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// UI Components
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { SidebarMenuButton } from '~/components/ui/Sidebar'

// Feature hooks
import { AddPracticeDialog } from '~/features/practices/components/AddPracticeDialog'
import { AddSourceDialog } from '~/features/sources/components/AddSourceDialog'
import { AddTopicDialog } from '~/features/topics/components/AddTopicDialog'

export function CreateButton() {
	// Hooks
	const navigate = useNavigate()

	// State for AddTopicDialog
	const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false)
	// State for AddSourceDialog
	const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false)
	// State for AddPracticeDialog
	const [isAddPracticeDialogOpen, setIsAddPracticeDialogOpen] = useState(false)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild={true}>
				<SidebarMenuButton
					className='bg-primary text-primary-foreground hover:bg-primary/90'
					tooltip='Create new...'
				>
					<Plus className='' />
					<span>Create</span>
				</SidebarMenuButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' side='right'>
				<DropdownMenuItem onClick={() => setIsAddTopicDialogOpen(true)}>
					<SquarePen />
					<span>New topic</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setIsAddSourceDialogOpen(true)}>
					<FileText />
					<span>New source</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setIsAddPracticeDialogOpen(true)}>
					<Dumbbell />
					<span>New practice</span>
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

			<AddPracticeDialog
				onOpenChange={setIsAddPracticeDialogOpen}
				onSuccess={practiceId => {
					toast('Practice created', {
						action: {
							label: 'Open',
							onClick: () =>
								navigate({
									to: '/practices/$practiceId',
									params: { practiceId: practiceId.toString() }
								})
						}
					})
				}}
				open={isAddPracticeDialogOpen}
				relationship={{ kind: 'standalone' }}
			/>
		</DropdownMenu>
	)
}
