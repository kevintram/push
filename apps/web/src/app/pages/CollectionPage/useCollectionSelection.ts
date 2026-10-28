import { useCallback, useEffect, useMemo, useState } from 'react'

import {
	type CollectionSelection,
	isSameSelection,
	selectionOrder,
} from './collectionOrder'
import type { GroupedCards } from './groupCardsBySection'

/** Matches the focus target of any selectable card or section. */
export const SELECTABLE_SELECTOR = '[data-card-id], [data-section-id]'

// Rows, controls, and anything layered above the page keep the selection.
const INTERACTIVE_SELECTOR =
	'tr, a, button, input, textarea, [role="menu"], [role="dialog"]'

function selectorFor(selection: CollectionSelection) {
	return selection.kind === 'card'
		? `[data-card-id="${selection.id}"]`
		: `[data-section-id="${selection.id}"]`
}

/**
 * The collection page's single selection. It follows its item through moves
 * and lapses once the item is gone, such as after a delete.
 */
export function useCollectionSelection(grouped: GroupedCards) {
	const [selection, setSelection] = useState<CollectionSelection | null>(null)
	const order = useMemo(() => selectionOrder(grouped), [grouped])
	const selected = order.some(entry => isSameSelection(entry, selection))
		? selection
		: null

	const selectAdjacent = useCallback(
		(step: -1 | 1) => {
			const index = order.findIndex(entry =>
				isSameSelection(entry, selected),
			)
			const next = order[index + step]
			if (index !== -1 && next) setSelection(next)
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
			selectorFor(selected),
		)
		if (target && target !== active) target.focus()
	}, [selected, order])

	return { selected, select: setSelection, clear, selectAdjacent }
}
