import { useContext } from 'react'
import { TopicDialogContext } from '../stores/TopicDialogContext'

export function useTopicDialog() {
	const context = useContext(TopicDialogContext)
	if (!context) {
		throw new Error(
			// biome-ignore lint/nursery/noSecrets: This is not a secret, it's an error message
			'useTopicDialog must be used within TopicDialogProvider'
		)
	}
	return context
}
