const FOCUS_NEW_REVIEW_CARD_PROMPT_STORAGE_KEY =
	'review-cards:focus-new-review-card-prompt'

export function requestFocusNewReviewCardPrompt(reviewCardId: number | string) {
	if (typeof window === 'undefined') return

	window.sessionStorage.setItem(
		FOCUS_NEW_REVIEW_CARD_PROMPT_STORAGE_KEY,
		reviewCardId.toString()
	)
}

export function consumeFocusNewReviewCardPrompt(reviewCardId: number | string) {
	if (typeof window === 'undefined') return false

	const requestedReviewCardId = window.sessionStorage.getItem(
		FOCUS_NEW_REVIEW_CARD_PROMPT_STORAGE_KEY
	)
	const shouldFocusPrompt = requestedReviewCardId === reviewCardId.toString()

	if (shouldFocusPrompt) {
		window.sessionStorage.removeItem(FOCUS_NEW_REVIEW_CARD_PROMPT_STORAGE_KEY)
	}

	return shouldFocusPrompt
}
