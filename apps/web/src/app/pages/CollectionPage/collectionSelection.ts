import { isSameItem, type SelectableItem } from './collectionOrder'

/**
 * The collection page's selection: one section, or one or more cards. A range
 * runs from `anchor`, where it started, to `cursor`, the end that moves and
 * holds focus.
 */
export type Selection = {
	items: ReadonlyArray<SelectableItem>
	anchor: SelectableItem
	cursor: SelectableItem
}

/** How a click changes the selection: replace it, extend a range, or toggle. */
export type SelectMode = 'only' | 'range' | 'toggle'

/** Shift extends a range and Mod toggles, as in a file list. */
export function selectModeFor(event: {
	shiftKey: boolean
	metaKey: boolean
	ctrlKey: boolean
}): SelectMode {
	if (event.shiftKey) return 'range'
	if (event.metaKey || event.ctrlKey) return 'toggle'
	return 'only'
}

export function isSelected(
	selection: Selection | null,
	item: SelectableItem,
): boolean {
	return selection?.items.some(entry => isSameItem(entry, item)) ?? false
}

export function selectOnly(item: SelectableItem): Selection {
	return { items: [item], anchor: item, cursor: item }
}

/**
 * The cards from `selection`'s anchor through `item`, in page order. Sections
 * in between are skipped, since only cards select together. A section target
 * selects just that section.
 */
export function selectRange(
	selection: Selection | null,
	order: ReadonlyArray<SelectableItem>,
	item: SelectableItem,
): Selection {
	if (!selection || item.kind === 'section') return selectOnly(item)

	const from = order.findIndex(entry => isSameItem(entry, selection.anchor))
	const to = order.findIndex(entry => isSameItem(entry, item))
	if (from === -1 || to === -1) return selectOnly(item)

	const items = order
		.slice(Math.min(from, to), Math.max(from, to) + 1)
		.filter(entry => entry.kind === 'card')

	return { items, anchor: selection.anchor, cursor: item }
}

/**
 * Adds a card to the selection or takes it out. A section can't join cards,
 * so toggling one, or a card while a section is selected, starts over.
 */
export function toggleItem(
	selection: Selection | null,
	item: SelectableItem,
): Selection | null {
	if (
		!selection ||
		item.kind === 'section' ||
		selection.items.some(entry => entry.kind === 'section')
	) {
		return selectOnly(item)
	}

	if (!isSelected(selection, item)) {
		return { items: [...selection.items, item], anchor: item, cursor: item }
	}

	const items = selection.items.filter(entry => !isSameItem(entry, item))
	const last = items.at(-1)
	return last ? { items, anchor: last, cursor: last } : null
}

/** Selects only the item `step` places from the cursor, or the cursor itself at an edge. */
export function stepSelection(
	selection: Selection,
	order: ReadonlyArray<SelectableItem>,
	step: -1 | 1,
): Selection {
	const index = order.findIndex(entry => isSameItem(entry, selection.cursor))
	return selectOnly(order[index + step] ?? selection.cursor)
}

/** Moves the cursor to the next card `step` away, extending the range to it. */
export function extendSelection(
	selection: Selection,
	order: ReadonlyArray<SelectableItem>,
	step: -1 | 1,
): Selection {
	const index = order.findIndex(entry => isSameItem(entry, selection.cursor))
	const ahead =
		step === 1 ? order.slice(index + 1) : order.slice(0, index).reverse()
	const next = ahead.find(entry => entry.kind === 'card')

	return next ? selectRange(selection, order, next) : selection
}

/**
 * Drops items no longer on the page, such as after a delete. The anchor and
 * cursor fall back to the remaining items. Null once nothing is left.
 */
export function pruneSelection(
	selection: Selection | null,
	order: ReadonlyArray<SelectableItem>,
): Selection | null {
	if (!selection) return null

	const onPage = (item: SelectableItem) =>
		order.some(entry => isSameItem(entry, item))
	const items = selection.items.filter(onPage)
	if (
		items.length === selection.items.length &&
		onPage(selection.anchor) &&
		onPage(selection.cursor)
	) {
		return selection
	}

	const first = items[0]
	const last = items.at(-1)
	if (!first || !last) return null

	return {
		items,
		anchor: onPage(selection.anchor) ? selection.anchor : first,
		cursor: onPage(selection.cursor) ? selection.cursor : last,
	}
}
