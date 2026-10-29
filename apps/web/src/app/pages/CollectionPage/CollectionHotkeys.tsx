import { type Hotkey, useHotkeys } from '@tanstack/react-hotkeys'

import { isInsideOverlay } from '~/utils/keyboard'

import type { MoveDirection } from './collectionOrder'
import { SELECTABLE_SELECTOR } from './useCollectionSelection'

const MOVES = [
	{ hotkey: 'Mod+ArrowUp', direction: 'up' },
	{ hotkey: 'Mod+ArrowDown', direction: 'down' },
	{ hotkey: 'Mod+Alt+ArrowUp', direction: 'top' },
	{ hotkey: 'Mod+Alt+ArrowDown', direction: 'bottom' },
] as const satisfies ReadonlyArray<{
	hotkey: Hotkey
	direction: MoveDirection
}>

/**
 * Whether a key reached the page or a selectable item, not another control
 * such as a text field.
 */
function isOnSelectable(event: KeyboardEvent) {
	const { target } = event
	return (
		!(target instanceof Element) ||
		target === document.body ||
		target.closest(SELECTABLE_SELECTOR) !== null
	)
}

type CollectionHotkeysProps = {
	hasSelection: boolean
	/** Whether the page has any card or section to select. */
	hasItems: boolean
	/**
	 * Steps the selection, or with `extend` grows its range. With nothing
	 * selected, starts at the first item going down or the last going up.
	 */
	onSelectAdjacent: (step: -1 | 1, extend: boolean) => void
	onSelectAll: () => void
	onMove: (direction: MoveDirection) => void
	/** Opens the selected card, or renames the selected section. */
	onOpen: () => void
	onClear: () => void
}

/**
 * Keyboard control of the collection page's selection. The arrows and Mod+A
 * also start a selection; the other keys act only on one. Keys typed into a
 * field, or pressed inside a dialog or menu, keep their own meaning.
 */
export function CollectionHotkeys({
	hasSelection,
	hasItems,
	onSelectAdjacent,
	onSelectAll,
	onMove,
	onOpen,
	onClear,
}: CollectionHotkeysProps) {
	// Each handler claims its key itself, so a key it ignores keeps its
	// browser behavior, like arrow navigation in a menu.
	const claim =
		(
			run: () => void,
			when: (event: KeyboardEvent) => boolean = () => true,
		) =>
		(event: KeyboardEvent) => {
			if (isInsideOverlay(event) || !when(event)) return
			event.preventDefault()
			run()
		}

	const withSelection = { enabled: hasSelection }

	useHotkeys(
		[
			{
				hotkey: 'ArrowUp',
				callback: claim(() => onSelectAdjacent(-1, false)),
			},
			{
				hotkey: 'ArrowDown',
				callback: claim(() => onSelectAdjacent(1, false)),
			},
			{
				hotkey: 'Shift+ArrowUp',
				callback: claim(() => onSelectAdjacent(-1, true)),
			},
			{
				hotkey: 'Shift+ArrowDown',
				callback: claim(() => onSelectAdjacent(1, true)),
			},
			{ hotkey: 'Mod+A', callback: claim(onSelectAll) },
			...MOVES.map(({ hotkey, direction }) => ({
				hotkey,
				callback: claim(() => onMove(direction)),
				options: withSelection,
			})),
			// Selectable items are buttons and links, which `ignoreInputs`
			// leaves Enter to, so this hotkey filters with `isOnSelectable`
			// instead: Enter on another focused control, like an "Add" button,
			// keeps activating that control.
			{
				hotkey: 'Enter',
				callback: claim(onOpen, isOnSelectable),
				options: { ...withSelection, ignoreInputs: false },
			},
			{
				hotkey: 'Escape',
				callback: claim(onClear),
				options: withSelection,
			},
		],
		{
			// On an empty page the arrows have nothing to select, so they keep
			// their browser behavior.
			enabled: hasItems,
			ignoreInputs: true,
			preventDefault: false,
			stopPropagation: false,
		},
	)

	return null
}
