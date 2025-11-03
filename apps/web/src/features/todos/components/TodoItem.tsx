import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { CalendarIcon, MoreVertical, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Checkbox } from '~/components/ui/Checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { Textarea } from '~/components/ui/Textarea'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Todo } from '~/models/todo-topic.types'
import { deleteTodo, removeTopicFromTodo, updateTodo } from '../api'
import { DatePickerDropdown } from './DatePickerDropdown'
import { TodoTopicBadges } from './TodoTopicBadges'

interface TodoItemProps {
	entry: Todo
	isCompleted?: boolean
	onTopicClick?: (
		topicId: number,
		name?: string | null,
		notes?: string | null
	) => void
}

export function TodoItem({
	entry,
	isCompleted = false,
	onTopicClick
}: TodoItemProps) {
	const queryClient = useQueryClient()

	const dateValue = (() => {
		if ('effective_date' in entry && entry.effective_date) {
			return entry.effective_date
		}
		if (isCompleted) {
			return entry.completed_at
		}
		return entry.scheduled_at
	})()
	const dateLabel = dateValue
		? dayjs(dateValue).toDate().toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric'
			})
		: ''

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
	const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
		if (isCompleted) {
			return entry.completed_at ? dayjs(entry.completed_at).toDate() : null
		}
		return entry.scheduled_at ? dayjs(entry.scheduled_at).toDate() : null
	})
	const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false)

	const { mutateAsync: updateTodoMutation } = useMutation({
		mutationFn: updateTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const { mutateAsync: deleteTodoMutation } = useMutation({
		mutationFn: deleteTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const { mutateAsync: removeTopicMutation } = useMutation({
		mutationFn: ({ todoId, topicId }: { todoId: number; topicId: number }) =>
			removeTopicFromTodo(todoId, topicId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			setIsChecked(checked)
			if (entry.id) {
				updateTodoMutation({
					id: entry.id,
					completed_at: checked ? dayjs().format('YYYY-MM-DD') : null
				})
			}
		},
		[entry.id, updateTodoMutation]
	)

	const updateDescription = useCallback(
		(newDescription: string) => {
			if (entry.id) {
				updateTodoMutation({
					id: entry.id,
					description: newDescription.trim()
				})
			}
		},
		[entry.id, updateTodoMutation]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: entry.description || '',
		onSave: updateDescription,
		key: `todo-entry-${entry.id}`
	})

	const handleDateSave = useCallback(
		(newDate: Date | null) => {
			setSelectedDate(newDate)
			if (entry.id) {
				if (isCompleted) {
					updateTodoMutation({
						id: entry.id,
						completed_at: newDate ? dayjs(newDate).format('YYYY-MM-DD') : null
					})
				} else {
					updateTodoMutation({
						id: entry.id,
						scheduled_at: newDate ? dayjs(newDate).format('YYYY-MM-DD') : null
					})
				}
			}
			setIsDatePopoverOpen(false)
		},
		[entry.id, updateTodoMutation, isCompleted]
	)

	const handleDelete = useCallback(async () => {
		if (entry.id) {
			await deleteTodoMutation(entry.id)
		}
	}, [entry.id, deleteTodoMutation])

	const handleRemoveTopicFromTodo = useCallback(
		async (todoId: number, topicId: number) => {
			await removeTopicMutation({ todoId, topicId })
		},
		[removeTopicMutation]
	)

	return (
		<div className='group rounded-lg px-4'>
			<div className='flex flex-col'>
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

				{/* Row 2: Spacer + Topics */}
				<div className='flex items-center gap-2'>
					{/* Spacer (same width as checkbox) */}
					<div className='w-6' />

					{/* Topics */}
					<TodoTopicBadges
						onRemoveTopicFromTodo={handleRemoveTopicFromTodo}
						onTopicClick={onTopicClick}
						todo={entry}
					/>
				</div>
			</div>
		</div>
	)
}
