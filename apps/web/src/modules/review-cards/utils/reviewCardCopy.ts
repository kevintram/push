import { type ReviewCardType } from '../types/review-card.types'

export function getReviewCardPrimaryFieldLabel(type: ReviewCardType): string {
	return type === 'practice' ? 'Title' : 'Prompt'
}

export function getReviewCardSecondaryFieldLabel(type: ReviewCardType): string {
	return type === 'practice' ? 'Description' : 'Answer'
}

export function getReviewCardDisplayTitle(reviewCard: {
	primary_text: string
	type: ReviewCardType
}): string {
	const trimmed = reviewCard.primary_text.trim()
	if (trimmed.length > 0) return trimmed
	return reviewCard.type === 'practice'
		? 'Untitled practice'
		: 'Untitled flashcard'
}
