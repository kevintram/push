import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { CalendarIcon, MoreHorizontal, Trash } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import { Checkbox } from '~/components/ui/Checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { isOverdue } from '~/features/topics/utils/isOverdue'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import type { Todo } from '~/models/todo-topic.types'
import { deleteTodo, removeTopicFromTodo, updateTodo } from '../api'
import { DatePickerDropdown } from './DatePickerDropdown'
import { TodoTopicBadges } from './TodoTopicBadges'

interface TodoItemProps {
	entry: Todo
	onTopicClick?: (topicId: number) => void
}

export function TodoItem({ entry, onTopicClick }: TodoItemProps) {
	const queryClient = useQueryClient()

	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
		if (entry.completed_at) {
			return entry.completed_at ? dayjs(entry.completed_at).toDate() : null
		}
		return entry.scheduled_at ? dayjs(entry.scheduled_at).toDate() : null
	})

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
		(description: string) => {
			if (entry.id) {
				updateTodoMutation({
					id: entry.id,
					description
				})
			}
		},
		[entry.id, updateTodoMutation]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: entry.description || '',
		onSave: updateDescription,
		key: `todo-${entry.id}`
	})

	const textareaRef = useAutoResizeTextarea(description)

	const handleDateSave = useCallback(
		(newDate: Date | null) => {
			setSelectedDate(newDate)
			if (entry.id) {
				const newDateString = newDate
					? dayjs(newDate).format('YYYY-MM-DD')
					: null
				if (entry.completed_at) {
					updateTodoMutation({
						id: entry.id,
						completed_at: newDateString
					})
				} else {
					updateTodoMutation({
						id: entry.id,
						scheduled_at: newDateString
					})
				}
			}
			setIsDatePopoverOpen(false)
		},
		[entry.id, entry.completed_at, updateTodoMutation]
	)

	const handleDelete = useCallback(async () => {
		if (entry?.id) {
			await deleteTodoMutation(entry.id)
		}
	}, [deleteTodoMutation, entry?.id])

	const handleRemoveTopicFromTodo = useCallback(
		async (todoId: number, topicId: number) => {
			await removeTopicMutation({ todoId, topicId })
		},
		[removeTopicMutation]
	)

	const handleTopicClick = useCallback(
		(topicId: number) => {
			onTopicClick?.(topicId)
		},
		[onTopicClick]
	)

	const effectiveDate: Date | null = useMemo(() => {
		if (entry.effective_date) {
			return dayjs(entry.effective_date).toDate()
		}
		return null
	}, [entry.effective_date])

	const isOverdueValue: boolean = useMemo(() => {
		return isOverdue({
			scheduledDate: entry.scheduled_at,
			isCompleted: entry.completed_at !== null
		})
	}, [entry.scheduled_at, entry.completed_at])

	// Check if entry was created recently (within last 10 seconds) for autofocus
	const isRecentlyCreated = useMemo(() => {
		if (!entry.inserted_at) return false
		const now = new Date()
		const createdAt = new Date(entry.inserted_at)
		const timeDiff = now.getTime() - createdAt.getTime()
		return timeDiff < 10_000 // 10 seconds
	}, [entry.inserted_at])

	return (
		<Card className='rounded border-none bg-transparent px-2 py-1 shadow-none'>
			<CardContent className='p-0'>
				<div className='group flex flex-row items-stretch gap-3 py-1'>
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
						<div className='flex min-w-0 flex-1 flex-col gap-1'>
							<textarea
								// biome-ignore lint/a11y/noAutofocus: intentional to focus newly created todo
								autoFocus={description === '' && isRecentlyCreated}
								className='break-word w-full resize-none border-none bg-transparent p-0 text-foreground text-xs shadow-none outline-none [overflow-wrap:anywhere] focus:outline-none focus-visible:ring-0'
								onChange={onDescriptionChange}
								placeholder='Description'
								ref={textareaRef}
								rows={1}
								spellCheck={false}
								value={description}
							/>
							<div className='mt-2'>
								<TodoTopicBadges
									onRemoveTopicFromTodo={handleRemoveTopicFromTodo}
									onTopicClick={handleTopicClick}
									todo={entry}
								/>
							</div>
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
										{effectiveDate?.toLocaleDateString()}
									</Button>
								}
							/>
						</div>
						<div className='relative flex items-start font-medium text-muted-foreground text-xs'>
							<div
								className={`transition-opacity duration-200 ${isDropdownOpen
										? 'opacity-100'
										: 'opacity-0 group-hover:opacity-100'
									}`}
							>
								<DropdownMenu onOpenChange={setIsDropdownOpen}>
									<DropdownMenuTrigger asChild={true}>
										<Button
											className='h-6 w-6 p-0'
											size='sm'
											title='More options'
											variant='ghost'
										>
											<MoreHorizontal className='h-3 w-3' />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align='end'
										avoidCollisions={true}
										side='bottom'
										sideOffset={4}
									>
										<DropdownMenuItem onClick={handleDelete}>
											<Trash className='mr-2 h-4 w-4' />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
