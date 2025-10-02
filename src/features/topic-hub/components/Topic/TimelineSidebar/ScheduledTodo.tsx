import { CalendarIcon, MoreHorizontal, Trash } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { DatePickerDropdown } from '~/components/DatePickerDropdown'
import { TodoTopicBadges } from '~/components/TodoTopicBadges'
import { Button } from '~/components/ui/Button'
import { Card, CardContent } from '~/components/ui/Card'
import { Checkbox } from '~/components/ui/Checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import { useAutoResizeTextarea } from '~/hooks/useAutoResizeTextarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { dateOf } from '../../../../../utils/dateOf'
import { numDaysElapsed } from '../../../utils/daysElapsed'
import { isOverdue } from '../../../utils/isOverdue'
import { DaysElapsedMarker } from './DaysElapsedMarker'
import type { TodoWithTopics } from './TimelineDataContext'
import { useTimelineData } from './TimelineDataContext'

export function ScheduledTodo({
	entry,
	index,
	nextDate
}: {
	entry: TodoWithTopics
	index: number
	nextDate?: Date | undefined // undefined if last entry
}) {
	const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date>(
		dateOf(entry.scheduled_at) || new Date()
	)

	const { updateTodo, deleteTodo, removeTopicFromTodo } = useTimelineData()

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			if (entry.id) {
				updateTodo(entry.id, {
					completed_at: checked ? new Date().toISOString() : null
				})
			}
		},
		[entry.id, updateTodo]
	)

	const updateDescription = useCallback(
		(description: string) => {
			if (entry.id) {
				updateTodo(entry.id, { description })
			}
		},
		[entry.id, updateTodo]
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
			if (entry.id) {
				updateTodo(entry.id, {
					scheduled_at: newDate.toISOString()
				})
			}
			setIsDatePopoverOpen(false)
		},
		[entry.id, updateTodo]
	)

	const handleDelete = useCallback(async () => {
		if (entry?.id) {
			await deleteTodo(entry.id)
		}
	}, [deleteTodo, entry?.id])

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
									onRemoveTopicFromTodo={removeTopicFromTodo}
									todoId={entry.id ?? undefined}
									topics={entry.todos_topics?.map(tt => tt.topics) ?? []}
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
						<div className='relative flex items-start font-medium text-muted-foreground text-xs'>
							{/* Original index display */}
							<span
								className={`transition-opacity duration-200 ${
									isDropdownOpen ? 'opacity-0' : 'group-hover:opacity-0'
								}`}
							>
								{index + 1}
							</span>

							{/* More icon button that appears on hover */}
							<div
								className={`-right-2 absolute top-0 transition-opacity duration-200 ${
									isDropdownOpen
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
