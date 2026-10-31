import { type Hotkey, useHotkeys } from '@tanstack/react-hotkeys'

import type { MoveDirection } from './collectionOrder'

const MOVES = [
	{ hotkey: 'Mod+ArrowUp', direction: 'up' },
	{ hotkey: 'Mod+ArrowDown', direction: 'down' },
	{ hotkey: 'Mod+Alt+ArrowUp', direction: 'top' },
	{ hotkey: 'Mod+Alt+ArrowDown', direction: 'bottom' },
] as const satisfies ReadonlyArray<{
	hotkey: Hotkey
	direction: MoveDirection
}>

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
 * field keep their own meaning, as do a menu's own navigation keys.
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
	const withSelection = { enabled: hasSelection }

	useHotkeys(
		[
			{
				hotkey: 'ArrowUp',
				callback: () => onSelectAdjacent(-1, false),
			},
			{
				hotkey: 'ArrowDown',
				callback: () => onSelectAdjacent(1, false),
			},
			{
				hotkey: 'Shift+ArrowUp',
				callback: () => onSelectAdjacent(-1, true),
			},
			{
				hotkey: 'Shift+ArrowDown',
				callback: () => onSelectAdjacent(1, true),
			},
			{ hotkey: 'Mod+A', callback: onSelectAll },
			...MOVES.map(({ hotkey, direction }) => ({
				hotkey,
				callback: () => onMove(direction),
				options: withSelection,
			})),
			{ hotkey: 'Enter', callback: onOpen, options: withSelection },
			{ hotkey: 'Escape', callback: onClear, options: withSelection },
		],
		{
			// On an empty page the arrows have nothing to select, so they keep
			// their browser behavior.
			enabled: hasItems,
			// `Mod+A`, `Mod+Arrow`, and `Escape` fire in text fields by default,
			// where they select text, move the caret, and cancel a rename.
			ignoreInputs: true,
		},
	)

	return null
}
