import type { Id } from '@convex/_generated/dataModel'
import type { CardMove } from '@convex/validators/cards'
import type { SectionMove } from '@convex/validators/sections'

import type { Card } from '~/modules/reviews/types/review.types'

import type { GroupedCards } from './groupCardsBySection'

/** A card or section that can be selected on the collection page. */
export type SelectableItem =
	| { kind: 'card'; id: Id<'cards'> }
	| { kind: 'section'; id: Id<'sections'> }

export type MoveDirection = 'up' | 'down' | 'top' | 'bottom'

export function isSameItem(a: SelectableItem, b: SelectableItem): boolean {
	return a.kind === b.kind && a.id === b.id
}

/**
 * Everything selectable in the order the page shows it: the unsectioned cards,
 * then each section followed by its cards.
 */
export function selectionOrder(grouped: GroupedCards): Array<SelectableItem> {
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

type CardLine = {
	sectionId: Id<'sections'> | null
	cards: ReadonlyArray<Card>
}

/** Cards placed as one run in a list, in the given order. */
export type CardBlockMove = CardMove & { cardIds: Array<Id<'cards'>> }

/** The page's card lists, top to bottom: the unsectioned cards, then each section's. */
function cardLines(grouped: GroupedCards): Array<CardLine> {
	return [
		{ sectionId: null, cards: grouped.unsectioned },
		...grouped.sections.map(({ section, cards }) => ({
			sectionId: section._id,
			cards,
		})),
	]
}

/** Each list's card ids after `move`. */
function linesAfterMove(
	lines: ReadonlyArray<CardLine>,
	{ cardIds, sectionId, afterId }: CardBlockMove,
): Array<Array<Id<'cards'>>> {
	const moving = new Set(cardIds)
	return lines.map(line => {
		const ids = line.cards
			.map(card => card._id)
			.filter(id => !moving.has(id))
		if (line.sectionId !== sectionId) return ids

		const index = afterId === null ? 0 : ids.indexOf(afterId) + 1
		return [...ids.slice(0, index), ...cardIds, ...ids.slice(index)]
	})
}

/**
 * Plans moving the selected cards one step as a block. They keep their order
 * and gather into one run, placed against the first selected card for up and
 * top, and against the last for down and bottom. Up and down cross into the
 * neighboring list at its edges: up from the top of a list lands at the bottom
 * of the list above, and down from the bottom lands at the top of the list
 * below. Top and bottom stay within that card's list. Null when the move would
 * leave everything where it is.
 */
export function planCardMove(
	grouped: GroupedCards,
	selectedIds: ReadonlySet<Id<'cards'>>,
	direction: MoveDirection,
): CardBlockMove | null {
	const lines = cardLines(grouped)
	const located = lines.flatMap((line, lineIndex) =>
		line.cards.flatMap((card, index) =>
			selectedIds.has(card._id)
				? [{ id: card._id, lineIndex, index }]
				: [],
		),
	)
	const first = located[0]
	const last = located.at(-1)
	if (!first || !last) return null

	const firstLine = lines[first.lineIndex]!
	const lastLine = lines[last.lineIndex]!
	const previous = lines[first.lineIndex - 1]
	const next = lines[last.lineIndex + 1]
	const lastUnselected = (line: CardLine) =>
		line.cards.findLast(card => !selectedIds.has(card._id))?._id ?? null

	const top = { sectionId: firstLine.sectionId, afterId: null }
	const bottom = {
		sectionId: lastLine.sectionId,
		afterId: lastUnselected(lastLine),
	}
	const below = lastLine.cards[last.index + 1]
	const targets: Record<MoveDirection, CardMove> = {
		top,
		bottom,
		// Above the card just above the first, which is two places up.
		up:
			first.index > 0
				? {
						sectionId: firstLine.sectionId,
						afterId: firstLine.cards[first.index - 2]?._id ?? null,
					}
				: previous
					? {
							sectionId: previous.sectionId,
							afterId: lastUnselected(previous),
						}
					: top,
		down: below
			? { sectionId: lastLine.sectionId, afterId: below._id }
			: next
				? { sectionId: next.sectionId, afterId: null }
				: bottom,
	}

	const plan = { cardIds: located.map(({ id }) => id), ...targets[direction] }
	const before = JSON.stringify(
		lines.map(line => line.cards.map(card => card._id)),
	)
	const after = JSON.stringify(linesAfterMove(lines, plan))
	return before === after ? null : plan
}
