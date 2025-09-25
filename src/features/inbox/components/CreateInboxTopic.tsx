import { useInsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '~/components/ui/Button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '~/components/ui/Dialog'
import { Input } from '~/components/ui/Input'
import { Label } from '~/components/ui/Label'
import { Textarea } from '~/components/ui/Textarea'
import { supabase } from '~/utils/supabase'

export function CreateInboxTopic() {
	const [open, setOpen] = useState(false)
	const [title, setTitle] = useState('')
	const [notes, setNotes] = useState('')
	const titleId = useId()
	const notesId = useId()

	const { mutateAsync: insertTopic } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*'
	)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (title.trim()) {
			try {
				await insertTopic([
					{
						name: title.trim(),
						notes: notes.trim(),
						is_inboxed: true
					}
				])
				setTitle('')
				setNotes('')
				setOpen(false)
			} catch (_error) {
				// Error handling could be added here if needed
			}
		}
	}

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild={true}>
				<Button>
					<Plus className='mr-2 h-4 w-4' />
					Quick Add
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Quick Topic</DialogTitle>
					<DialogDescription>
						Add a new topic to your inbox for later processing
					</DialogDescription>
				</DialogHeader>
				<form className='space-y-4' onSubmit={handleSubmit}>
					<div>
						<Label htmlFor={titleId}>Title</Label>
						<Input
							autoFocus={true}
							id={titleId}
							onChange={e => setTitle(e.target.value)}
							placeholder='Enter topic title...'
							value={title}
						/>
					</div>
					<div>
						<Label htmlFor={notesId}>Notes (optional)</Label>
						<Textarea
							id={notesId}
							onChange={e => setNotes(e.target.value)}
							placeholder='Add any notes or thoughts...'
							rows={3}
							value={notes}
						/>
					</div>
					<DialogFooter>
						<Button
							onClick={() => setOpen(false)}
							type='button'
							variant='outline'
						>
							Cancel
						</Button>
						<Button disabled={!title.trim()} type='submit'>
							Create Topic
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
