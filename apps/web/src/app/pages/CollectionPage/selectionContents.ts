import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'

import type { Card } from '~/modules/reviews/types/review.types'
import { pluralize } from '~/utils/pluralize'

import type { GroupedCards } from './groupCardsBySection'

/** What a selection holds, each list in page order. */
export type SelectionContents = {
	sections: Array<Section>
	/**
	 * The selected cards outside the selected sections. A card inside one goes
	 * wherever its section goes, so moves and deletes don't name it twice.
	 */
	cards: Array<Card>
	/**
	 * Every card the selection reaches: the selected cards and every card in the
	 * selected sections. The card actions apply to these, and the counts count
	 * them.
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

const count = (n: number, noun: string) => (n === 0 ? null : pluralize(n, noun))

/**
 * The selection counted by kind. The cards in the selected sections count,
 * since the selection reaches them too.
 */
const counts = ({ sections, coveredCards }: SelectionContents) =>
	[
		count(sections.length, 'section'),
		count(coveredCards.length, 'card'),
	].filter(Boolean)

/** The selection counted, as in "2 sections, 5 cards". */
export function countItems(contents: SelectionContents): string {
	return counts(contents).join(', ')
}

/**
 * The selection named for a dialog title: "section" or "card" for one item, as
 * the section's and card's own menus name it, or counted, as in "2 sections
 * and 5 cards".
 */
export function nameItems(contents: SelectionContents): string {
	const { sections, cards } = contents
	if (sections.length === 1 && cards.length === 0) return 'section'
	if (sections.length === 0 && cards.length === 1) return 'card'
	return counts(contents).join(' and ')
}
