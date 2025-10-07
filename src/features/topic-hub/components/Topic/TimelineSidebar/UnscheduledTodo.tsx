import { Calendar as CalendarIcon, MoreHorizontal, Trash } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { DatePickerDropdown } from '~/components/DatePickerDropdown'
import { TodoTopicBadges } from '~/components/TodoTopicBadges'
import { Button } from '~/components/ui/Button'
import { Checkbox } from '~/components/ui/Checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { toDateString, todayDateString } from '~/utils/dateFormatting'
import type { TodoWithTopics } from './TimelineDataContext'
import { useTimelineData } from './TimelineDataContext'

interface UnscheduledTodoProps {
	entry: TodoWithTopics
}

export function UnscheduledTodo({ entry }: UnscheduledTodoProps) {
	const { updateTodo, deleteTodo, removeTopicFromTodo } = useTimelineData()

	const handleToggleComplete = useCallback(
		(checked: boolean) => {
			if (entry.id == null) return
			updateTodo(entry.id, {
				completed_at: checked ? todayDateString() : null
			})
		},
		[entry.id, updateTodo]
	)

	const updateDescription = useCallback(
		(description: string) => {
			if (entry.id == null) return
			updateTodo(entry.id, { description })
		},
		[entry.id, updateTodo]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: entry.description || '',
		onSave: updateDescription,
		key: `todo-entry-${entry.id}`
	})

	const textareaRef = useAutoResizeTextarea(description)
	const isCompleted = !!entry.completed_at

	// Check if entry was created recently (within last 10 seconds)
	const isRecentlyCreated = useMemo(() => {
		if (!entry.inserted_at) return false
		const now = new Date()
		const createdAt = new Date(entry.inserted_at)
		const timeDiff = now.getTime() - createdAt.getTime()
		return timeDiff < 10_000 // 10 seconds
	}, [entry.inserted_at])

	const [isSchedulePopoverOpen, setIsSchedulePopoverOpen] = useState(false)
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

	const handleDelete = useCallback(async () => {
		if (entry?.id) {
			await deleteTodo(entry.id)
		}
	}, [deleteTodo, entry?.id])

	const handleSchedule = useCallback(
		(date: Date | null) => {
			if (entry.id == null) return
			if (date === null) return // Don't unschedule unscheduled todos
			setSelectedDate(date)
			updateTodo(entry.id, {
				scheduled_at: toDateString(date)
			})
			setIsSchedulePopoverOpen(false)
		},
		[entry.id, updateTodo]
	)

	return (
		<div className='group flex items-start gap-2 py-1'>
			<div className='flex flex-1 flex-row items-start gap-2.5'>
				<Checkbox
					checked={isCompleted}
					className='mt-1 flex'
					onCheckedChange={handleToggleComplete}
				/>
				<div className='flex min-w-0 flex-1 flex-col'>
					<textarea
						// biome-ignore lint/a11y/noAutofocus: because I feel like it's fine in this case
						autoFocus={description === '' && isRecentlyCreated}
						className='break-word mt-0.5 w-full resize-none border-none bg-transparent p-0 text-sm shadow-none outline-none [overflow-wrap:anywhere] focus:outline-none focus-visible:ring-0'
						onChange={onDescriptionChange}
						placeholder='New Todo'
						ref={textareaRef}
						rows={1}
						spellCheck={false}
						value={description}
					/>
					<div className='mt-1'>
						<TodoTopicBadges
							onRemoveTopicFromTodo={removeTopicFromTodo}
							todoId={entry.id ?? undefined}
							topics={entry.todos_topics?.map(tt => tt.topics) ?? []}
						/>
					</div>
				</div>
			</div>

			{/* Action buttons - with gradient background */}
			<div
				className={`flex gap-1 bg-gradient-to-l from-80% from-sidebar to-transparent transition-opacity ${
					isSchedulePopoverOpen || isDropdownOpen
						? 'opacity-100'
						: 'opacity-0 group-hover:opacity-100'
				}`}
			>
				{/* Schedule button */}
				<DatePickerDropdown
					align='start'
					isOpen={isSchedulePopoverOpen}
					onDateChange={handleSchedule}
					onOpenChange={setIsSchedulePopoverOpen}
					selectedDate={selectedDate}
					side='right'
					sideOffset={10}
					trigger={
						<Button
							className='h-6 w-6 p-0'
							size='sm'
							title='Schedule'
							variant='ghost'
						>
							<CalendarIcon className='h-3 w-3' />
						</Button>
					}
				/>

				{/* More options dropdown */}
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
	)
}
