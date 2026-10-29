import { useCallback, useEffect, useMemo, useState } from 'react'

import { type SelectableItem, selectionOrder } from './collectionOrder'
import {
	extendSelection,
	pruneSelection,
	type Selection,
	type SelectMode,
	selectOnly,
	selectRange,
	stepSelection,
	toggleItem,
} from './collectionSelection'
import type { GroupedCards } from './groupCardsBySection'

/** Matches the focus target of any selectable card or section. */
export const SELECTABLE_SELECTOR = '[data-card-id], [data-section-id]'

// Rows, controls, the selection's action bar, and anything layered above the
// page keep the selection.
const INTERACTIVE_SELECTOR =
	'tr, a, button, input, textarea, [role="toolbar"], [role="menu"], [role="dialog"]'

function selectorFor(item: SelectableItem) {
	return item.kind === 'card'
		? `[data-card-id="${item.id}"]`
		: `[data-section-id="${item.id}"]`
}

/**
 * The collection page's selection. It follows its items through moves and
 * drops each one once it is gone, such as after a delete.
 */
export function useCollectionSelection(grouped: GroupedCards) {
	const [selection, setSelection] = useState<Selection | null>(null)
	const order = useMemo(() => selectionOrder(grouped), [grouped])
	// Memoized so the effects below don't rerun on every render while an item
	// is gone and the state still names it.
	const selected = useMemo(
		() => pruneSelection(selection, order),
		[selection, order],
	)

	const select = useCallback(
		(item: SelectableItem, mode: SelectMode = 'only') => {
			switch (mode) {
				case 'only':
					return setSelection(selectOnly(item))
				case 'range':
					return setSelection(selectRange(selected, order, item))
				case 'toggle':
					return setSelection(toggleItem(selected, item))
			}
		},
		[order, selected],
	)

	/**
	 * Steps to the next item, or with `extend` grows the range to it. With
	 * nothing selected, selects the first item going down or the last going up.
	 */
	const selectAdjacent = useCallback(
		(step: -1 | 1, extend: boolean) => {
			// The arrows drive the selection, so focus follows it even from a
			// control elsewhere, like the sidebar link that opened this page,
			// which the focus effect below would otherwise leave alone.
			const active = document.activeElement
			if (
				active instanceof HTMLElement &&
				!active.closest(SELECTABLE_SELECTOR)
			) {
				active.blur()
			}

			if (!selected) {
				const edge = step === 1 ? order[0] : order.at(-1)
				if (edge) setSelection(selectOnly(edge))
				return
			}
			setSelection(
				extend
					? extendSelection(selected, order, step)
					: stepSelection(selected, order, step),
			)
		},
		[order, selected],
	)

	const clear = useCallback(() => {
		setSelection(null)

		// The focus ring goes with the selection.
		const active = document.activeElement
		if (
			active instanceof HTMLElement &&
			active.closest(SELECTABLE_SELECTOR)
		) {
			active.blur()
		}
	}, [])

	// A click anywhere on the page outside the cards, sections, and controls
	// clears the selection, like clicking empty space in a file list.
	useEffect(() => {
		if (!selected) return

		const handleClick = (event: MouseEvent) => {
			if (
				event.target instanceof Element &&
				!event.target.closest(INTERACTIVE_SELECTOR)
			) {
				clear()
			}
		}
		document.addEventListener('click', handleClick)
		return () => document.removeEventListener('click', handleClick)
	}, [selected, clear])

	// Focus follows the selection, so it scrolls into view and is announced.
	// That includes after a move re-renders the item in its new place. Focus in
	// a field, menu, or dialog is left alone.
	useEffect(() => {
		if (!selected) return

		const active = document.activeElement
		if (
			active &&
			active !== document.body &&
			!active.closest(SELECTABLE_SELECTOR)
		) {
			return
		}

		const target = document.querySelector<HTMLElement>(
			selectorFor(selected.cursor),
		)
		if (target && target !== active) target.focus()
	}, [selected, order])

	return { selected, select, clear, selectAdjacent }
}
