import { useHotkeys } from '@tanstack/react-hotkeys'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

type SelectionActionHotkeysProps = {
	/** Whether the selection covers any cards, which flag, retire, and type need. */
	hasCards: boolean
	onToggleFlag: () => void
	onToggleRetire: () => void
	onToggleType: () => void
	onMove: () => void
	onDelete: () => void
}

/**
 * Keys for the selection's action bar, the same keys a card's own actions
 * use. Move and delete open their dialogs, so neither acts without one.
 */
export function SelectionActionHotkeys({
	hasCards,
	onToggleFlag,
	onToggleRetire,
	onToggleType,
	onMove,
	onDelete,
}: SelectionActionHotkeysProps) {
	const withCards = { enabled: hasCards }

	useHotkeys([
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
			hotkey: appHotkeys.toggleSelectionType,
			callback: onToggleType,
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
	])

	return null
}
