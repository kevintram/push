const FOCUS_NEW_REVIEW_CARD_PRIMARY_TEXT_STORAGE_KEY =
	'review-cards:focus-new-review-card-primary-text'

export function requestFocusNewReviewCardPrimaryText(
	reviewCardId: number | string,
) {
	if (typeof window === 'undefined') return

	window.sessionStorage.setItem(
		FOCUS_NEW_REVIEW_CARD_PRIMARY_TEXT_STORAGE_KEY,
		reviewCardId.toString(),
	)
}

export function consumeFocusNewReviewCardPrimaryText(
	reviewCardId: number | string,
) {
	if (typeof window === 'undefined') return false

	const requestedReviewCardId = window.sessionStorage.getItem(
		FOCUS_NEW_REVIEW_CARD_PRIMARY_TEXT_STORAGE_KEY,
	)
	const shouldFocusPrimaryText =
		requestedReviewCardId === reviewCardId.toString()

	if (shouldFocusPrimaryText) {
		window.sessionStorage.removeItem(
			FOCUS_NEW_REVIEW_CARD_PRIMARY_TEXT_STORAGE_KEY,
		)
	}

	return shouldFocusPrimaryText
}
