import {
	useDeleteMutation,
	useRevalidateTables,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import dayjs from 'dayjs'
import { CalendarIcon, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Calendar } from '~/components/ui/Calendar'
import { Input } from '~/components/ui/Input'
import { Textarea } from '~/components/ui/Textarea'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'

// Unified todo type that works with both todo tables
type TodoEntry = (Tables<'todos'> | Tables<'todos_with_effective_date'>) & {
	topics?: { name: string } | null
}

interface EditTodoFormProps {
	entry: TodoEntry
	topicName?: string | null
	onClose: () => void
}

export function EditTodoForm({ entry, topicName, onClose }: EditTodoFormProps) {
	const [selectedDate, setSelectedDate] = useState<Date>(
		dayjs(entry.scheduled_at).toDate()
	)
	const [description, setDescription] = useState(entry.description || '')

	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'todos' },
		{ schema: 'public', table: 'todos_today' },
		{ schema: 'public', table: 'todos_with_effective_date' }
	])

	const { mutateAsync: updateTodoMutation } = useUpdateMutation(
		supabase.from('todos'),
		['id'],
		'*, topics(name)',
		{
			onSuccess: () => {
				revalidateTables()
			}
		}
	)

	const { mutateAsync: deleteTodoMutation } = useDeleteMutation(
		supabase.from('todos'),
		['id']
	)

	const handleSave = useCallback(() => {
		updateTodoMutation({
			id: entry.id ?? undefined,
			scheduled_at: dayjs(selectedDate).format('YYYY-MM-DD'),
			description: description.trim()
		})
		onClose()
	}, [entry.id, selectedDate, description, updateTodoMutation, onClose])

	const handleDelete = useCallback(async () => {
		await deleteTodoMutation({ id: entry.id ?? undefined })
		revalidateTables()
		onClose()
	}, [entry.id, deleteTodoMutation, revalidateTables, onClose])

	return (
		<div className='flex w-full flex-col items-center gap-4'>
			{topicName && (
				<h3 className='text-center font-semibold text-lg'>{topicName}</h3>
			)}
			<div className='flex w-full flex-col items-center gap-2'>
				<Calendar
					className='bg-popover text-popover-foreground'
					mode='single'
					onSelect={setSelectedDate}
					required={true}
					selected={selectedDate}
				/>
				<div className='relative w-full'>
					<CalendarIcon className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
					<Input
						className='pl-10'
						readOnly={true}
						value={
							selectedDate
								? selectedDate.toLocaleDateString('en-US', {
										weekday: 'long',
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})
								: ''
						}
					/>
				</div>
			</div>
			<Textarea
				className='min-h-[144px] w-full resize-none'
				onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
					setDescription(e.target.value)
				}
				placeholder='Description...'
				value={description}
			/>
			<div className='flex w-full flex-row items-center justify-between gap-2'>
				<Button
					className='text-red-600 hover:text-red-700'
					onClick={handleDelete}
					variant='ghost'
				>
					<Trash2 className='h-4 w-4' />
				</Button>
				<Button onClick={handleSave}>Save</Button>
			</div>
		</div>
	)
}
