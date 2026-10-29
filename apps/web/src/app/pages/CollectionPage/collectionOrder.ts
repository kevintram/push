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
 * `ids` with `run` taken out and put back, in its own order, right after
 * `afterId`, or first when it is null.
 */
function withRunPlaced<T>(
	ids: ReadonlyArray<T>,
	run: ReadonlyArray<T>,
	afterId: T | null,
): Array<T> {
	const moving = new Set(run)
	const others = ids.filter(id => !moving.has(id))
	const index = afterId === null ? 0 : others.indexOf(afterId) + 1
	return [...others.slice(0, index), ...run, ...others.slice(index)]
}

/** Sections placed as one run, in the given order. */
export type SectionBlockMove = SectionMove & {
	sectionIds: Array<Id<'sections'>>
}

/**
 * Plans moving the selected sections one step as a block among the
 * collection's sections. Like cards, they keep their order and gather into one
 * run, placed against the first selected section for up and top, and against
 * the last for down and bottom. The unsectioned cards stay above every
 * section. Null when the move would leave everything where it is.
 */
export function planSectionMove(
	grouped: GroupedCards,
	selectedIds: ReadonlySet<Id<'sections'>>,
	direction: MoveDirection,
): SectionBlockMove | null {
	const ids = grouped.sections.map(({ section }) => section._id)
	const sectionIds = ids.filter(id => selectedIds.has(id))
	if (sectionIds.length === 0) return null

	const first = ids.indexOf(sectionIds[0]!)
	const last = ids.indexOf(sectionIds.at(-1)!)

	const lastUnselected = ids.findLast(id => !selectedIds.has(id)) ?? null
	const afterIds: Record<MoveDirection, Id<'sections'> | null> = {
		// Above the section just above the first, which is two places up.
		up: ids[first - 2] ?? null,
		down: ids[last + 1] ?? lastUnselected,
		top: null,
		bottom: lastUnselected,
	}

	const plan = { sectionIds, afterId: afterIds[direction] }
	const after = withRunPlaced(ids, sectionIds, plan.afterId)
	return after.every((id, index) => id === ids[index]) ? null : plan
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
		const ids = line.cards.map(card => card._id)
		return line.sectionId === sectionId
			? withRunPlaced(ids, cardIds, afterId)
			: ids.filter(id => !moving.has(id))
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
