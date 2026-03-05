export const CREATE_TOPIC_INTENT_EVENT = 'topics:create-topic'
const CREATE_TOPIC_INTENT_STORAGE_KEY = 'topics:create-topic'

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
