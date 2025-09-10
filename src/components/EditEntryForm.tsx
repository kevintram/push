import {
	useDeleteMutation,
	useRevalidateTables,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { CalendarIcon, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Calendar } from '~/components/ui/Calendar'
import { Input } from '~/components/ui/Input'
import { Textarea } from '~/components/ui/Textarea'
import type { Tables } from '~/types/database.types'
import { dateOf } from '~/utils/dateOf'
import { supabase } from '~/utils/supabase'

// Unified entry type that works with both timeline tables
type TimelineEntry = (
	| Tables<'timeline_entries'>
	| Tables<'timeline_entries_with_effective_date'>
) & { topics?: { name: string } | null }

interface EditEntryFormProps {
	entry: TimelineEntry
	topicName?: string | null
	onClose: () => void
}

export function EditEntryForm({
	entry,
	topicName,
	onClose
}: EditEntryFormProps) {
	const [selectedDate, setSelectedDate] = useState<Date>(
		dateOf(entry.scheduled_at)!
	)
	const [description, setDescription] = useState(entry.description || '')

	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'timeline_entries' },
		{ schema: 'public', table: 'timeline_entries_today' },
		{ schema: 'public', table: 'timeline_entries_with_effective_date' }
	])

	const { mutateAsync: updateTimelineEntryMutation } = useUpdateMutation(
		supabase.from('timeline_entries'),
		['id'],
		'*, topics(name)',
		{
			onSuccess: () => {
				revalidateTables()
			}
		}
	)

	const { mutateAsync: deleteTimelineEntryMutation } = useDeleteMutation(
		supabase.from('timeline_entries'),
		['id']
	)

	const handleSave = useCallback(() => {
		updateTimelineEntryMutation({
			id: entry.id ?? undefined,
			scheduled_at: selectedDate.toISOString(),
			description: description.trim()
		})
		onClose()
	}, [
		entry.id,
		selectedDate,
		description,
		updateTimelineEntryMutation,
		onClose
	])

	const handleDelete = useCallback(async () => {
		await deleteTimelineEntryMutation({ id: entry.id ?? undefined })
		revalidateTables()
		onClose()
	}, [entry.id, deleteTimelineEntryMutation, revalidateTables, onClose])

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
