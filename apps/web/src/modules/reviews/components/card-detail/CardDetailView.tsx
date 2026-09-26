import type { Id } from '@convex/_generated/dataModel'
import { useState } from 'react'

import { CardDetail, type CardTab } from './CardDetail'

type CardDetailViewProps = {
	cardId: Id<'cards'>
	showGoToCard?: boolean
	onNavigate?: () => void
}

export function CardDetailView({
	cardId,
	showGoToCard = false,
	onNavigate,
}: CardDetailViewProps) {
	const [activeTab, setActiveTab] = useState<CardTab>('overview')

	return (
		<CardDetail
			cardId={cardId}
			activeTab={activeTab}
			onTabChange={setActiveTab}
			showGoToCard={showGoToCard}
			onNavigate={onNavigate}
		/>
	)
}
