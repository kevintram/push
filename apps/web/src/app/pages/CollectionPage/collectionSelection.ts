import { isSameItem, type SelectableItem } from './collectionOrder'

/**
 * The collection page's selection: one or more sections and cards. A range
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

/** The items from `selection`'s anchor through `item`, in page order. */
export function selectRange(
	selection: Selection | null,
	order: ReadonlyArray<SelectableItem>,
	item: SelectableItem,
): Selection {
	if (!selection) return selectOnly(item)

	const from = order.findIndex(entry => isSameItem(entry, selection.anchor))
	const to = order.findIndex(entry => isSameItem(entry, item))
	if (from === -1 || to === -1) return selectOnly(item)

	return {
		items: order.slice(Math.min(from, to), Math.max(from, to) + 1),
		anchor: selection.anchor,
		cursor: item,
	}
}

/** Adds an item to the selection or takes it out. */
export function toggleItem(
	selection: Selection | null,
	item: SelectableItem,
): Selection | null {
	if (!selection) return selectOnly(item)

	if (!isSelected(selection, item)) {
		return { items: [...selection.items, item], anchor: item, cursor: item }
	}

	const items = selection.items.filter(entry => !isSameItem(entry, item))
	const last = items.at(-1)
	return last ? { items, anchor: last, cursor: last } : null
}

/**
 * Every item on the page. The first item is the cursor, so focus stays at the
 * top of the page rather than jumping to the bottom. Null when there are none.
 */
export function selectAll(
	order: ReadonlyArray<SelectableItem>,
): Selection | null {
	const first = order[0]
	const last = order.at(-1)
	if (!first || !last) return null

	return { items: [...order], anchor: last, cursor: first }
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

/** Moves the cursor `step` places, extending the range to it. */
export function extendSelection(
	selection: Selection,
	order: ReadonlyArray<SelectableItem>,
	step: -1 | 1,
): Selection {
	const index = order.findIndex(entry => isSameItem(entry, selection.cursor))
	const next = order[index + step]

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
