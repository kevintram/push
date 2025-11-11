import { createContext } from 'react'
import type { Todo } from '~/models/todo-topic.types'

export const TodoContext = createContext<{
	todo: Todo | undefined
	isLoading: boolean
}>({
	todo: undefined,
	isLoading: false
})
