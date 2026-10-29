import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'

import type { Card } from '~/modules/reviews/types/review.types'

import type { GroupedCards } from './groupCardsBySection'

/** What a selection holds, each list in page order. */
export type SelectionContents = {
	sections: Array<Section>
	/**
	 * The selected cards outside the selected sections. A card inside one goes
	 * wherever its section goes, so it isn't counted or acted on twice.
	 */
	cards: Array<Card>
	/**
	 * Every card the card actions apply to: the selected cards and every card in
	 * the selected sections.
	 */
	coveredCards: Array<Card>
}

export function selectionContents(
	grouped: GroupedCards,
	sectionIds: ReadonlySet<Id<'sections'>>,
	cardIds: ReadonlySet<Id<'cards'>>,
): SelectionContents {
	const sections: Array<Section> = []
	const cards = grouped.unsectioned.filter(card => cardIds.has(card._id))
	const coveredCards = [...cards]

	for (const { section, cards: inSection } of grouped.sections) {
		if (sectionIds.has(section._id)) {
			sections.push(section)
			coveredCards.push(...inSection)
		} else {
			const selected = inSection.filter(card => cardIds.has(card._id))
			cards.push(...selected)
			coveredCards.push(...selected)
		}
	}

	return { sections, cards, coveredCards }
}

const count = (n: number, noun: string) =>
	n === 0 ? null : `${n} ${noun}${n === 1 ? '' : 's'}`

/** The selection counted by kind, as in "2 sections, 1 card". */
export function countItems({ sections, cards }: SelectionContents): string {
	return [count(sections.length, 'section'), count(cards.length, 'card')]
		.filter(Boolean)
		.join(', ')
}

/**
 * The selection named for a dialog title: "section" or "card" for one item, or
 * counted, as in "2 sections and 1 card".
 */
export function nameItems({ sections, cards }: SelectionContents): string {
	if (sections.length + cards.length === 1) {
		return sections.length === 1 ? 'section' : 'card'
	}
	return [count(sections.length, 'section'), count(cards.length, 'card')]
		.filter(Boolean)
		.join(' and ')
}
