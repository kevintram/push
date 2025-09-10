import { useUpdateMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { CalendarIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Calendar } from '~/components/ui/Calendar'
import { Input } from '~/components/ui/Input'
import { Label } from '~/components/ui/Label'
import { Textarea } from '~/components/ui/Textarea'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { dateOf } from '../../../../../utils/dateOf'

export function EditEntry({
	entry,
	onClose
}: {
	entry: Tables<'timeline_entries_with_effective_date'>
	onClose: () => void
}) {
	const [selectedDate, setSelectedDate] = useState<Date>(
		dateOf(entry.scheduled_at)!
	)
	const [description, setDescription] = useState(entry.description || '')

	const { mutateAsync: updateTimelineEntryMutation } = useUpdateMutation(
		supabase.from('timeline_entries_with_effective_date'),
		['id'],
		'*'
	)

	const handleSave = useCallback(() => {
		updateTimelineEntryMutation({
			id: entry.id,
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

	return (
		<div className='flex w-full flex-col items-start gap-6'>
			<div className='flex w-full flex-col items-start gap-4'>
				<div className='flex w-full flex-col items-start gap-2'>
					<Label>Scheduled at</Label>
					<Calendar
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
			</div>
			<div className='flex w-full items-center justify-end gap-2'>
				<Button onClick={handleSave}>Save</Button>
			</div>
		</div>
	)
}
