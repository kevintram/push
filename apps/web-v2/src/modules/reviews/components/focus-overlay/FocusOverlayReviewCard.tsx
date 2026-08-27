import type { Id } from '@convex/_generated/dataModel'
import { useState } from 'react'

import {
	ReviewCardDetail,
	type ReviewCardTab,
} from '../review-card-detail/ReviewCardDetail'

type FocusOverlayReviewCardProps = {
	reviewCardId: Id<'reviewCards'>
	onNavigate: () => void
}

export function FocusOverlayReviewCard({
	reviewCardId,
	onNavigate,
}: FocusOverlayReviewCardProps) {
	const [activeTab, setActiveTab] = useState<ReviewCardTab>('overview')

	return (
		<ReviewCardDetail
			reviewCardId={reviewCardId}
			activeTab={activeTab}
			onTabChange={setActiveTab}
			onNavigate={onNavigate}
		/>
	)
}
