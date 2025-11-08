import { use } from 'react'
import { TodoTopicDialogContext } from '../stores/TodoTopicDialogContext'

export function useTodoTopicDialog() {
	const context = use(TodoTopicDialogContext)
	if (!context) {
		throw new Error(
			// biome-ignore lint/nursery/noSecrets: This is not a secret, it's an error message
			'useTodoTopicDialog must be used within TodoTopicDialogProvider'
		)
	}
	return context
}
