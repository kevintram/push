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

/** Whether a key reached the page or a selectable item, not another control. */
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
	onSelectAdjacent: (step: -1 | 1) => void
	onMove: (direction: MoveDirection) => void
	/** Opens the selected card, or renames the selected section. */
	onOpen: () => void
	onClear: () => void
}

/**
 * Keyboard control of the collection page's selection, active while something
 * is selected. Keys typed into a field, or pressed inside a dialog or menu,
 * keep their own meaning.
 */
export function CollectionHotkeys({
	hasSelection,
	onSelectAdjacent,
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

	useHotkeys(
		[
			{ hotkey: 'ArrowUp', callback: claim(() => onSelectAdjacent(-1)) },
			{ hotkey: 'ArrowDown', callback: claim(() => onSelectAdjacent(1)) },
			...MOVES.map(({ hotkey, direction }) => ({
				hotkey,
				callback: claim(() => onMove(direction)),
			})),
			// Enter on another focused control, like an "Add" button, keeps
			// activating that control.
			{ hotkey: 'Enter', callback: claim(onOpen, isOnSelectable) },
			{ hotkey: 'Escape', callback: claim(onClear) },
		],
		{
			enabled: hasSelection,
			ignoreInputs: true,
			preventDefault: false,
			stopPropagation: false,
		},
	)

	return null
}
