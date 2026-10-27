import type { Section } from '@convex/validators/sections'

import type { Card } from '~/modules/reviews/types/review.types'

export type CardSection = {
	section: Section
	cards: Array<Card>
}

export type GroupedCards = {
	unsectioned: Array<Card>
	sections: Array<CardSection>
}

/**
 * Splits a collection's cards into its unsectioned cards and one group per
 * section, keeping the order of both inputs. A card naming a section that is
 * not listed counts as unsectioned, so a card is never hidden.
 */
export function groupCardsBySection(
	sections: ReadonlyArray<Section>,
	cards: ReadonlyArray<Card>,
): GroupedCards {
	const sectionGroups = new Map(
		sections.map(section => [
			section._id,
			{ section, cards: [] as Array<Card> },
		]),
	)
	const unsectioned: Array<Card> = []

	for (const card of cards) {
		const group =
			card.sectionId === undefined
				? undefined
				: sectionGroups.get(card.sectionId)

		if (group) {
			group.cards.push(card)
		} else {
			unsectioned.push(card)
		}
	}

	return { unsectioned, sections: [...sectionGroups.values()] }
}
