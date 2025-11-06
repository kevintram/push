import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { use, useCallback, useRef } from 'react'
import { Checkbox } from '~/components/ui/Checkbox'
import { Textarea } from '~/components/ui/Textarea'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useResizeObserver } from '~/hooks/useResizeObserver'
import { deleteTodo as deleteTodoApi } from '../../api/deleteTodo'
import { removeTopicFromTodo as removeTopicFromTodoApi } from '../../api/removeTopicFromTodo'
import { updateTodo as updateTodoApi } from '../../api/updateTodo'
import { TodoContext } from '../../stores/SelectedTodoContext'
import { TodoDetailHeader } from './TodoDetailHeader'
import { TodoTopicsPanel } from './TodoTopicsPanel'

interface TodoDetailProps {
	onDelete?: () => void | Promise<void>
	headerActions?: ReactNode
}

export function TodoDetail({ onDelete, headerActions }: TodoDetailProps) {
	const { todo, isLoading } = use(TodoContext)
	const queryClient = useQueryClient()

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

	if (isLoading || !todo) {
		return <div>Loading...</div>
	}

	return (
		<div className='flex h-full min-h-0 flex-col'>
			<TodoDetailHeader
				headerActions={headerActions}
				onDateChange={handleDateChange}
				onDelete={handleDelete}
				todo={todo}
			/>
			<div
				className='scrollbar-track-transparent flex min-h-0 w-full flex-col overflow-y-scroll px-6 py-4'
				ref={scrollContainerRef}
			>
				<div className='flex flex-row items-start gap-3 pb-4'>
					<Checkbox
						checked={!!todo.completed_at}
						className='mt-1'
						onCheckedChange={handleCheckboxChange}
					/>
					<Textarea
						className='!bg-transparent break-word m-0 min-h-12 w-full flex-1 resize-none rounded-none border-none p-0 shadow-none focus:outline-none focus-visible:border-none focus-visible:ring-0'
						onChange={onDescriptionChange}
						placeholder='Description'
						ref={descriptionRef}
						spellCheck={false}
						value={description}
					/>
				</div>
				<TodoTopicsPanel
					getScrollElement={() => scrollContainerRef.current}
					onRemoveTopicFromTodo={handleRemoveTopicFromTodo}
				/>
			</div>
		</div>
	)
}
