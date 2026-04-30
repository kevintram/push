import { ReviewCardDetailSurface } from './ReviewCardDetailSurface'
import type { ReviewCardDetailTab } from './shared'

export function ReviewCardDetailPage({
	reviewCardId,
	activeTab,
	onActiveTabChange
}: {
	reviewCardId: number
	activeTab?: ReviewCardDetailTab | string
	onActiveTabChange?: (tab: ReviewCardDetailTab) => void
}) {
	return (
		<ReviewCardDetailSurface
			activeTab={activeTab}
			mode='fullPage'
			onActiveTabChange={onActiveTabChange}
			reviewCardId={reviewCardId}
		/>
	)
}
