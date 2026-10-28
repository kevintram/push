import type { Id } from '@convex/_generated/dataModel'
import type { ReactNode } from 'react'

import { CardItem } from '~/modules/reviews/components/CardItem'
import { CardList } from '~/modules/reviews/components/CardList'
import type { Card } from '~/modules/reviews/types/review.types'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import type { DateString } from '~/types/date'

import { AddToCollectionMenu } from './AddToCollectionMenu'
import { type SelectMode, selectModeFor } from './collectionSelection'

type CardGroupProps = {
	cards: ReadonlyArray<Card>
	today: DateString
	title: ReactNode
	/** The title's heading level. Defaults to 2. */
	headingLevel?: 2 | 3
	actions?: ReactNode
	/** Names the group's "Add" menu for assistive technology. */
	addLabel: string
	isAdding: boolean
	onAddCard: () => void
	onAddSection: () => void
	/** The selected cards across the page, in page order. */
	selectedCards: ReadonlyArray<Card>
	onSelectCard: (cardId: Id<'cards'>, mode: SelectMode) => void
}

/** One group of cards on the collection page, followed by its "Add" menu. */
export function CardGroup({
	cards,
	today,
	title,
	headingLevel,
	actions,
	addLabel,
	isAdding,
	onAddCard,
	onAddSection,
	selectedCards,
	onSelectCard,
}: CardGroupProps) {
	return (
		<div>
			<CardList
				title={title}
				headingLevel={headingLevel}
				actions={actions}
			>
				{cards.map(card => (
					<CardItem
						key={card._id}
						card={card}
						srs={deriveCardSrsState(card, today)}
						today={today}
						active={selectedCards.some(
							({ _id }) => _id === card._id,
						)}
						onSelect={event =>
							onSelectCard(card._id, selectModeFor(event))
						}
						selection={selectedCards}
					/>
				))}
			</CardList>
			<AddToCollectionMenu
				label={addLabel}
				disabled={isAdding}
				onAddCard={onAddCard}
				onAddSection={onAddSection}
			/>
		</div>
	)
}
