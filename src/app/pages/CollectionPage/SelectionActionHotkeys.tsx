import { type UseHotkeyDefinition, useHotkeys } from '@tanstack/react-hotkeys'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

type SelectionActionHotkeysProps = {
	menuElement: HTMLDivElement | null
	/** Whether the selection covers any cards, which flag and retire need. */
	hasCards: boolean
	onToggleFlag: () => void
	onToggleRetire: () => void
	onMove: () => void
	onDelete: () => void
}

/**
 * Keys for the selection's action bar, the same keys a card's own actions
 * use. Move and delete open their dialogs, so neither acts without one.
 */
export function SelectionActionHotkeys({
	menuElement,
	hasCards,
	onToggleFlag,
	onToggleRetire,
	onMove,
	onDelete,
}: SelectionActionHotkeysProps) {
	const withCards = { enabled: hasCards }

	const hotkeys: ReadonlyArray<UseHotkeyDefinition> = [
		{
			hotkey: appHotkeys.toggleSelectionFlag,
			callback: onToggleFlag,
			options: withCards,
		},
		{
			hotkey: appHotkeys.toggleSelectionRetire,
			callback: onToggleRetire,
			options: withCards,
		},
		{
			hotkey: appHotkeys.moveSelection,
			callback: onMove,
		},
		{
			hotkey: appHotkeys.deleteSelection,
			callback: onDelete,
			// `Mod` chords fire in text fields by default, but this one
			// deletes to the start of the line there.
			options: { ignoreInputs: true },
		},
	]

	useHotkeys(hotkeys)
	// The menu owns letter keys for typeahead. Handle our commands on its
	// popup before typeahead, leaving navigation and activation to the menu.
	useHotkeys(hotkeys, { target: menuElement, capture: true })

	return null
}
