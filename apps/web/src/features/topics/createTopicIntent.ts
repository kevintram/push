export const CREATE_TOPIC_INTENT_EVENT = 'topics:create-topic'
const CREATE_TOPIC_INTENT_STORAGE_KEY = 'topics:create-topic'
const FOCUS_NEW_TOPIC_TITLE_STORAGE_KEY = 'topics:focus-new-topic-title'

export function requestCreateTopic() {
	if (typeof window === 'undefined') return

	window.sessionStorage.setItem(CREATE_TOPIC_INTENT_STORAGE_KEY, 'true')
	window.dispatchEvent(new Event(CREATE_TOPIC_INTENT_EVENT))
}

export function consumeCreateTopicRequest() {
	if (typeof window === 'undefined') return false

	const shouldCreateTopic =
		window.sessionStorage.getItem(CREATE_TOPIC_INTENT_STORAGE_KEY) === 'true'

	if (shouldCreateTopic) {
		window.sessionStorage.removeItem(CREATE_TOPIC_INTENT_STORAGE_KEY)
	}

	return shouldCreateTopic
}

export function requestFocusNewTopicTitle(topicId: number | string) {
	if (typeof window === 'undefined') return

	window.sessionStorage.setItem(
		FOCUS_NEW_TOPIC_TITLE_STORAGE_KEY,
		topicId.toString()
	)
}

export function consumeFocusNewTopicTitle(topicId: number | string) {
	if (typeof window === 'undefined') return false

	const requestedTopicId = window.sessionStorage.getItem(
		FOCUS_NEW_TOPIC_TITLE_STORAGE_KEY
	)
	const shouldFocusTitle = requestedTopicId === topicId.toString()

	if (shouldFocusTitle) {
		window.sessionStorage.removeItem(FOCUS_NEW_TOPIC_TITLE_STORAGE_KEY)
	}

	return shouldFocusTitle
}
