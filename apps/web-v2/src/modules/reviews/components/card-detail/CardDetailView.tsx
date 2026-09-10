import type { Id } from '@convex/_generated/dataModel'
import { useState } from 'react'

import { CardDetail, type CardTab } from './CardDetail'

type CardDetailViewProps = {
	cardId: Id<'cards'>
	onNavigate?: () => void
}

export function CardDetailView({ cardId, onNavigate }: CardDetailViewProps) {
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
