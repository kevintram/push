import { use } from 'react'
import { TopicDialogContext } from '../stores/TopicDialogContext'

export function useTopicDialog() {
	const context = use(TopicDialogContext)
	if (!context) {
		throw new Error('useTopicDialog must be used within TopicDialogProvider')
	}
	return context
}
