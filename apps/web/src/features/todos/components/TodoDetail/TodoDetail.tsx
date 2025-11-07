import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { use, useCallback, useEffect, useRef, useState } from 'react'
import { Checkbox } from '~/components/ui/Checkbox'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { deleteTodo as deleteTodoApi } from '../../api/deleteTodo'
import { removeTopicFromTodo as removeTopicFromTodoApi } from '../../api/removeTopicFromTodo'
import { updateTodo as updateTodoApi } from '../../api/updateTodo'
import { TodoContext } from '../../stores/SelectedTodoContext'
import { AddTopicToTodoDialog } from '../AddTopicToTodoDialog'
import { TodoDetailHeader } from './TodoDetailHeader'
import { TodoTopicsPanel } from './TodoTopicsPanel'

interface TodoDetailProps {
	onDelete?: () => void | Promise<void>
	headerActions?: ReactNode
}

export function TodoDetail({ onDelete, headerActions }: TodoDetailProps) {
	const { todo, isLoading } = use(TodoContext)
	const queryClient = useQueryClient()
	const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false)

	const { mutateAsync: updateTodoMutation } = useMutation({
		mutationFn: updateTodoApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const { mutateAsync: deleteTodoMutation } = useMutation({
		mutationFn: deleteTodoApi,
		onSuccess: async () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
			if (onDelete) {
				await onDelete()
			}
		}
	})

	const { mutateAsync: removeTopicMutation } = useMutation({
		mutationFn: ({ todoId, topicId }: { todoId: number; topicId: number }) =>
			removeTopicFromTodoApi(todoId, topicId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['todos'] })
		}
	})

	const updateDescriptionMutation = useCallback(
		(newDescription: string) => {
			if (todo?.id) {
				updateTodoMutation({ id: todo.id, description: newDescription })
			}
		},
		[updateTodoMutation, todo?.id]
	)

	const handleDelete = useCallback(async () => {
		if (todo?.id) {
			await deleteTodoMutation(todo.id)
		}
	}, [deleteTodoMutation, todo?.id])

	const handleCheckboxChange = useCallback(
		(checked: boolean) => {
			if (todo?.id) {
				updateTodoMutation({
					id: todo.id,
					completed_at: checked ? dayjs().format('YYYY-MM-DD') : null
				})
			}
		},
		[todo?.id, updateTodoMutation]
	)

	const handleRemoveTopicFromTodo = useCallback(
		async (todoId: number, topicId: number) => {
			await removeTopicMutation({ todoId, topicId })
		},
		[removeTopicMutation]
	)

	const handleAddTopic = useCallback(() => {
		setIsAddTopicDialogOpen(true)
	}, [])

	const handleDateChange = useCallback(
		(newDate: Date | null) => {
			if (todo?.id) {
				const newDateString = newDate
					? dayjs(newDate).format('YYYY-MM-DD')
					: null
				if (todo.completed_at) {
					updateTodoMutation({
						id: todo.id,
						completed_at: newDateString
					})
				} else {
					updateTodoMutation({
						id: todo.id,
						scheduled_at: newDateString
					})
				}
			}
		},
		[todo?.id, todo?.completed_at, updateTodoMutation]
	)

	const { value: description, onChange: onDescriptionChange } = useAutoSave({
		initialValue: todo?.description ?? '',
		onSave: updateDescriptionMutation,
		key: `todo-detail-${todo?.id}`
	})

	const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
	const [scrollContainerRef] = useResizeObserver<HTMLDivElement>()

	// focus on description whenever selected todo changes
	useEffect(() => {
		if (descriptionRef.current) {
			descriptionRef.current.focus()
		}
	}, [todo?.id])

	if (isLoading || !todo) {
		return <div>Loading...</div>
	}

	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<div className='sticky top-0 z-10 w-full border-b'>
				<TodoDetailHeader
					headerActions={headerActions}
					onDateChange={handleDateChange}
					onDelete={handleDelete}
					todo={todo}
				/>
			</div>

			<div
				className='scrollbar-track-transparent flex flex-1 gap-4 overflow-y-auto p-4'
				ref={scrollContainerRef}
			>
				<Checkbox
					checked={!!todo.completed_at}
					className='mt-0.5'
					onCheckedChange={handleCheckboxChange}
				/>
				<div className='flex-1'>
					<Textarea
						className='!bg-transparent m-0 min-h-0 resize-none rounded-none border-none p-0 pb-4 shadow-none [overflow-wrap:anywhere] focus:outline-none focus-visible:border-none focus-visible:ring-0'
						onChange={onDescriptionChange}
						placeholder='Description'
						ref={descriptionRef}
						spellCheck={false}
						value={description}
					/>
					<div className='w-full flex-1'>
						<TodoTopicsPanel
							getScrollElement={() => scrollContainerRef.current}
							onAddTopic={handleAddTopic}
							onRemoveTopicFromTodo={handleRemoveTopicFromTodo}
						/>
					</div>
				</div>
			</div>
			<AddTopicToTodoDialog
				onOpenChange={setIsAddTopicDialogOpen}
				open={isAddTopicDialogOpen}
				todo={todo}
			/>
		</div>
	)
}
