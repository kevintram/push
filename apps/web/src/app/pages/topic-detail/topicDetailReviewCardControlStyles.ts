import { type TopicDetailReviewCardControlsVariant } from './shared'

export function getReviewCardControlSize(
	controlsVariant: TopicDetailReviewCardControlsVariant,
) {
	if (controlsVariant === 'compact') return 'xs'
	if (controlsVariant === 'medium') return 'xs'
	return 'sm'
}

export function getReviewCardControlClassName(
	controlsVariant: TopicDetailReviewCardControlsVariant,
) {
	if (controlsVariant === 'compact') {
		return 'h-5 rounded-4xl px-2 text-xs'
	}

	if (controlsVariant === 'medium') {
		return 'h-6 rounded-full px-2.5 text-xs'
	}

	return 'rounded-full'
}
