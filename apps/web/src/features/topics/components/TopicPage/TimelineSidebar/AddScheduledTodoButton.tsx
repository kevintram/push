import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { CalendarIcon, Plus } from 'lucide-react'
import { use, useCallback, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Calendar } from '~/components/ui/Calendar'
import { Input } from '~/components/ui/Input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '~/components/ui/Popover'
import { Textarea } from '~/components/ui/Textarea'
import { createTodo } from '~/features/todos/api'
import { TopicContext } from '../../../stores/SelectedTopicContext'
import { useTimelineData } from './TimelineDataContext'

export function AddScheduledTodoButton() {
	const { topic: selectedTopic } = use(TopicContext)
	const { addTopicToTodo } = useTimelineData()
	const [isOpen, setIsOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [description, setDescription] = useState('')

	const queryClient = useQueryClient()

	const { mutateAsync: createTodoMutation } = useMutation({
		mutationFn: createTodo,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const handleSave = useCallback(async () => {
		if (!selectedTopic) return

		const completedAt = dayjs(selectedDate).isBefore(dayjs(), 'day')
			? dayjs(selectedDate).format('YYYY-MM-DD')
			: null

		const todo = await createTodoMutation({
			description: description.trim(),
			scheduledAt: dayjs(selectedDate).format('YYYY-MM-DD'),
			completedAt
		})

		await addTopicToTodo(todo.id, selectedTopic.id)

		setIsOpen(false)

		// reset to default values after saving
		setDescription('')
		setSelectedDate(new Date())
	}, [
		selectedTopic,
		selectedDate,
		description,
		createTodoMutation,
		addTopicToTodo
	])

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild={true}>
				<Button size='sm' variant='ghost'>
					<Plus className='h-4 w-4' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-80 p-6'>
				<div className='flex w-full flex-col items-start gap-6'>
					<div className='flex w-full flex-col items-start gap-4'>
						<div className='flex w-full flex-col items-center gap-2'>
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
									placeholder='Tuesday, March 26th 2024'
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
						<Button disabled={!selectedTopic} onClick={handleSave}>
							Save
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
