import type { Id } from '@convex/_generated/dataModel'
import type { CardMove } from '@convex/validators/cards'
import type { SectionMove } from '@convex/validators/sections'

import type { GroupedCards } from './groupCardsBySection'

/** The one card or section selected on the collection page. */
export type CollectionSelection =
	| { kind: 'card'; id: Id<'cards'> }
	| { kind: 'section'; id: Id<'sections'> }

export type MoveDirection = 'up' | 'down' | 'top' | 'bottom'

export function isSameSelection(
	a: CollectionSelection | null,
	b: CollectionSelection | null,
): boolean {
	return a?.kind === b?.kind && a?.id === b?.id
}

/**
 * Everything selectable in the order the page shows it: the unsectioned cards,
 * then each section followed by its cards.
 */
export function selectionOrder(
	grouped: GroupedCards,
): Array<CollectionSelection> {
	return [
		...grouped.unsectioned.map(card => ({
			kind: 'card' as const,
			id: card._id,
		})),
		...grouped.sections.flatMap(({ section, cards }) => [
			{ kind: 'section' as const, id: section._id },
			...cards.map(card => ({ kind: 'card' as const, id: card._id })),
		]),
	]
}

/**
 * Where `ids[index]` lands when moved within its own list, as the item it goes
 * after. Null when the move would leave it where it is.
 */
function placementInList<T>(
	ids: ReadonlyArray<T>,
	index: number,
	direction: MoveDirection,
): { afterId: T | null } | null {
	const isFirst = index === 0
	const isLast = index === ids.length - 1

	switch (direction) {
		case 'up':
			return isFirst ? null : { afterId: ids[index - 2] ?? null }
		case 'down':
			return isLast ? null : { afterId: ids[index + 1]! }
		case 'top':
			return isFirst ? null : { afterId: null }
		case 'bottom':
			return isLast ? null : { afterId: ids.at(-1)! }
	}
}

/**
 * Plans moving a section among the collection's sections. The unsectioned
 * cards stay above every section.
 */
export function planSectionMove(
	grouped: GroupedCards,
	sectionId: Id<'sections'>,
	direction: MoveDirection,
): SectionMove | null {
	const ids = grouped.sections.map(({ section }) => section._id)
	const index = ids.indexOf(sectionId)

	return index === -1 ? null : placementInList(ids, index, direction)
}

/**
 * Plans moving a card. Up and down cross into the neighboring list at its
 * edges: up from the top of a section lands at the bottom of the list above,
 * and down from the bottom lands at the top of the list below. Top and bottom
 * stay within the card's own list.
 */
export function planCardMove(
	grouped: GroupedCards,
	cardId: Id<'cards'>,
	direction: MoveDirection,
): CardMove | null {
	const lists = [
		{ sectionId: null, cards: grouped.unsectioned },
		...grouped.sections.map(({ section, cards }) => ({
			sectionId: section._id,
			cards,
		})),
	]
	const listIndex = lists.findIndex(list =>
		list.cards.some(card => card._id === cardId),
	)
	if (listIndex === -1) return null

	const { sectionId, cards } = lists[listIndex]!
	const ids = cards.map(card => card._id)
	const placement = placementInList(ids, ids.indexOf(cardId), direction)
	if (placement) return { sectionId, ...placement }

	const previous = lists[listIndex - 1]
	if (direction === 'up' && previous) {
		return {
			sectionId: previous.sectionId,
			afterId: previous.cards.at(-1)?._id ?? null,
		}
	}

	const next = lists[listIndex + 1]
	if (direction === 'down' && next) {
		return { sectionId: next.sectionId, afterId: null }
	}

	return null
}
