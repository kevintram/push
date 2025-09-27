import {
	useRevalidateTables,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { CalendarIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { DatePickerDropdown } from '~/components/DatePickerDropdown'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import { Checkbox } from '~/components/ui/Checkbox'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Tables } from '~/types/database.types'
import { supabase } from '~/utils/supabase'
import { dateOf } from '../../../../../utils/dateOf'
import { numDaysElapsed } from '../../../utils/daysElapsed'
import { isOverdue } from '../../../utils/isOverdue'
import { DaysElapsedMarker } from './DaysElapsedMarker'

export function ScheduledTodo({
	entry,
	index,
	nextDate
}: {
	entry: Tables<'todos_with_effective_date'>
	index: number
	nextDate?: Date | undefined // undefined if last entry
}) {
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date>(
		dateOf(entry.scheduled_at) || new Date()
	)

	const revalidateOtherTodoTables = useRevalidateTables([
		{ schema: 'public', table: 'todos' },
		{ schema: 'public', table: 'todos_today' }
	])

	const { mutateAsync: updateTodoMutation } = useUpdateMutation(
		supabase.from('todos'),
		['id'],
		'*',
		{
			onSuccess: () => {
				revalidateOtherTodoTables()
			}
		}
	)

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			updateTodoMutation({
				id: entry.id ?? undefined,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTodoMutation]
	)

	const updateDescription = useCallback(
		(description: string) => {
			updateTodoMutation({
				id: entry.id ?? undefined,
				description
			})
		},
		[entry.id, updateTodoMutation]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: entry.description || '',
		onSave: updateDescription,
		key: `scheduled-todo-${entry.id}`
	})

	const textareaRef = useAutoResizeTextarea(description)

	const handleDateSave = useCallback(
		(newDate: Date) => {
			setSelectedDate(newDate)
			updateTodoMutation({
				id: entry.id ?? undefined,
				scheduled_at: newDate.toISOString()
			})
			setIsDatePopoverOpen(false)
		},
		[entry.id, updateTodoMutation]
	)

	const effectiveDate: Date = useMemo(() => {
		return dateOf(entry.effective_date)!
	}, [entry.effective_date])

	const isOverdueValue: boolean = useMemo(() => {
		return isOverdue({
			scheduledDate: entry.scheduled_at,
			isCompleted: entry.completed_at !== null
		})
	}, [entry.scheduled_at, entry.completed_at])

	return (
		<Card className='rounded border-none bg-transparent px-2 py-1 shadow-none'>
			<CardContent className='p-0'>
				<div className='flex flex-row items-stretch gap-3 py-1'>
					<Checkbox
						checked={!!entry.completed_at}
						className={
							isOverdueValue
								? 'border-red-600 dark:border-red-700 dark:bg-red-700'
								: ''
						}
						onCheckedChange={handleCheckboxChange}
					/>
					<div className='flex min-w-0 flex-1 items-stretch gap-3'>
						<div className='min-w-0 flex-1'>
							<textarea
								className='break-word w-full resize-none border-none bg-transparent p-0 text-foreground text-xs shadow-none outline-none [overflow-wrap:anywhere] focus:outline-none focus-visible:ring-0'
								onChange={onDescriptionChange}
								placeholder='Description'
								ref={textareaRef}
								rows={1}
								spellCheck={false}
								value={description}
							/>
						</div>
						<div className='flex flex-col items-end gap-2 text-xs'>
							<DatePickerDropdown
								isOpen={isDatePopoverOpen}
								onDateChange={handleDateSave}
								onOpenChange={setIsDatePopoverOpen}
								selectedDate={selectedDate}
								trigger={
									<Button
										className='h-auto p-1 text-xs hover:bg-muted/50'
										size='sm'
										variant='ghost'
									>
										<CalendarIcon className='mr-1 h-3 w-3' />
										{effectiveDate.toLocaleDateString()}
									</Button>
								}
							/>
							{nextDate && (
								<div className='mr-6 flex h-full'>
									<DaysElapsedMarker
										daysElapsed={numDaysElapsed(effectiveDate, nextDate)}
									/>
								</div>
							)}
						</div>
						<div className='flex items-start font-medium text-muted-foreground text-xs'>
							{index + 1}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
