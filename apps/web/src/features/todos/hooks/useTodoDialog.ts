import { use } from 'react'
import { TodoDialogContext } from '../stores/TodoDialogContext'

export function useTodoDialog() {
	const context = use(TodoDialogContext)
	if (!context) {
		// biome-ignore lint/nursery/noSecrets: This is not a secret, it's an error message
		throw new Error('useTodoDialog must be used within TodoDialogProvider')
	}
	return context
}
