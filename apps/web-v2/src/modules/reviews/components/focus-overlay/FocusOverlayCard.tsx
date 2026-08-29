import type { Id } from '@convex/_generated/dataModel'
import { useState } from 'react'

import { CardDetail, type CardTab } from '../card-detail/CardDetail'

type FocusOverlayCardProps = {
	cardId: Id<'cards'>
	onNavigate: () => void
}

export function FocusOverlayCard({
	cardId,
	onNavigate,
}: FocusOverlayCardProps) {
	const [activeTab, setActiveTab] = useState<CardTab>('overview')

	return (
		<CardDetail
			cardId={cardId}
			activeTab={activeTab}
			onTabChange={setActiveTab}
			onNavigate={onNavigate}
		/>
	)
}
