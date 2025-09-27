import {
	useDeleteMutation,
	useRevalidateTables,
	useUpdateMutation
} from '@supabase-cache-helpers/postgrest-react-query'
import { Link } from '@tanstack/react-router'
import { CalendarIcon, MoreVertical, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { DatePickerDropdown } from '~/components/DatePickerDropdown'
import { Button } from '~/components/ui/Button'
import { Checkbox } from '~/components/ui/Checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Textarea } from '~/components/ui/Textarea'
import { isOverdue } from '~/features/topic-hub/utils/isOverdue'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Tables } from '~/types/database.types'
import { dateOf } from '~/utils/dateOf'
import { supabase } from '~/utils/supabase'

// TODO: clean up this mess when migrate to hono API
type TodoEntry = (Tables<'todos'> | Tables<'todos_with_effective_date'>) & {
	todos_topics: Array<{ topics: { id: number; name: string } }>
}

interface TodoItemProps {
	entry: TodoEntry
	isCompleted?: boolean
}

export function TodoItem({ entry, isCompleted = false }: TodoItemProps) {
	const revalidateTables = useRevalidateTables([
		{ schema: 'public', table: 'todos' },
		{ schema: 'public', table: 'todos_today' },
		{ schema: 'public', table: 'todos_with_effective_date' }
	])

	const dateValue = (() => {
		if ('effective_date' in entry && entry.effective_date) {
			return entry.effective_date
		}
		if (isCompleted) {
			return entry.completed_at
		}
		return entry.scheduled_at
	})()
	const dateLabel = dateOf(dateValue)?.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	})

	const isOverdueValue = useMemo(
		() =>
			isOverdue({
				scheduledDate: entry.scheduled_at,
				isCompleted
			}),
		[isCompleted, entry.scheduled_at]
	)

	const [isChecked, setIsChecked] = useState(isCompleted)
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date>(
		dateOf(entry.scheduled_at)!
	)
	const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false)

	const { mutateAsync: updateTodoMutation } = useUpdateMutation(
		supabase.from('todos'),
		['id'],
		'*, todos_topics(topics(id, name))',
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

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			setIsChecked(checked)
			updateTodoMutation({
				id: entry.id ?? undefined,
				completed_at: checked ? new Date().toISOString() : null
			})
		},
		[entry.id, updateTodoMutation]
	)

	const updateDescription = useCallback(
		(newDescription: string) => {
			updateTodoMutation({
				id: entry.id ?? undefined,
				description: newDescription.trim()
			})
		},
		[entry.id, updateTodoMutation]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: entry.description || '',
		onSave: updateDescription,
		key: `todo-entry-${entry.id}`
	})

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

	const handleDelete = useCallback(async () => {
		await deleteTodoMutation({ id: entry.id ?? undefined })
		revalidateTables()
	}, [entry.id, deleteTodoMutation, revalidateTables])

	return (
		<div className='group rounded-lg p-4'>
			<div className='flex flex-col gap-2'>
				{/* Row 1: Checkbox + Description + Date + More Button */}
				<div className='flex items-start gap-4'>
					{/* Checkbox */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper div to prevent event propagation to parent */}
					{/* biome-ignore lint/nursery/noNoninteractiveElementInteractions: wrapper div to prevent event propagation to parent */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper div only prevents propagation, keyboard interaction handled by child Checkbox */}
					<div
						onClick={e => {
							e.preventDefault()
							e.stopPropagation()
						}}
					>
						<Checkbox
							checked={isChecked}
							className={`mt-2 ${isOverdueValue ? 'border-red-500 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500' : ''}`}
							onCheckedChange={handleCheckboxChange}
						/>
					</div>

					{/* Description */}
					<Textarea
						className='!bg-transparent mt-1 mb-1 min-h-[1.5rem] flex-1 resize-none border-0 p-0 text-md leading-relaxed shadow-none focus:border-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-transparent focus-visible:ring-0'
						onChange={onDescriptionChange}
						placeholder='Description'
						rows={1}
						value={description}
					/>

					{/* Date and More Actions */}
					<div className='flex items-center gap-0'>
						{/* Date */}
						<DatePickerDropdown
							isOpen={isDatePopoverOpen}
							onDateChange={handleDateSave}
							onOpenChange={setIsDatePopoverOpen}
							selectedDate={selectedDate}
							trigger={
								<Button
									className='h-auto whitespace-nowrap p-1 text-muted-foreground text-sm hover:bg-muted/50'
									size='sm'
									variant='ghost'
								>
									<CalendarIcon className='mr-1 h-3 w-3' />
									{dateLabel}
								</Button>
							}
						/>

						{/* More Actions Dropdown */}
						<DropdownMenu
							onOpenChange={setIsMoreDropdownOpen}
							open={isMoreDropdownOpen}
						>
							<DropdownMenuTrigger asChild={true}>
								<Button
									className='h-6 w-6 p-0 text-muted-foreground hover:text-foreground'
									size='sm'
									variant='ghost'
								>
									<MoreVertical className='h-3 w-3' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-32'>
								<DropdownMenuItem
									className='text-red-600 focus:text-red-600'
									onClick={() => {
										handleDelete()
										setIsMoreDropdownOpen(false)
									}}
								>
									<Trash2 className='mr-2 h-4 w-4' />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Row 2: Spacer + Topic */}
				<div className='flex items-center gap-2'>
					{/* Spacer (same width as checkbox) */}
					<div className='w-6' />

					{/* Topics */}
					<div className='flex flex-1 flex-wrap gap-2'>
						{entry.todos_topics?.map(todoTopic => (
							<Link
								className='break-word text-muted-foreground text-sm [overflow-wrap:anywhere] hover:underline'
								key={todoTopic.topics.id}
								params={{ topicId: todoTopic.topics.id?.toString() ?? '' }}
								to='/topics/{-$topicId}'
							>
								{todoTopic.topics.name}
							</Link>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
