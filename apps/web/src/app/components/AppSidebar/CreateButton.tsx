import { Plus } from 'lucide-react'
import { useState } from 'react'
import { SidebarMenuButton } from '~/components/ui/sidebar'
import { AddNoteDialog } from '~/features/notes/components/AddNoteDialog'

export function CreateButton() {
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	return (
		<>
			<SidebarMenuButton
				className='bg-primary text-primary-foreground hover:bg-primary/90'
				onClick={() => setIsDialogOpen(true)}
				tooltip='Create'
			>
				<Plus />
				<span>Create</span>
			</SidebarMenuButton>
			<AddNoteDialog onOpenChange={setIsDialogOpen} open={isDialogOpen} />
		</>
	)
}
