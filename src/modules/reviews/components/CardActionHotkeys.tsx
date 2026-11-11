import { useHotkeys } from '@tanstack/react-hotkeys'

import { appHotkeys } from '~/modules/shortcuts/appHotkeys'

type CardActionHotkeysProps = {
	onToggleFlag: () => void
	onToggleRetire: () => void
	onMove: () => void
	onDelete: () => void
}

/**
 * Keys for the card's action menu. Move and delete open their dialogs, so
 * neither acts without one.
 */
export function CardActionHotkeys({
	onToggleFlag,
	onToggleRetire,
	onMove,
	onDelete,
}: CardActionHotkeysProps) {
	useHotkeys([
		{
			hotkey: appHotkeys.toggleFlag,
			callback: onToggleFlag,
		},
		{
			hotkey: appHotkeys.toggleRetire,
			callback: onToggleRetire,
		},
		{ hotkey: appHotkeys.moveCard, callback: onMove },
		{
			hotkey: appHotkeys.deleteCard,
			callback: onDelete,
			// `Mod` chords fire in text fields by default, but this one deletes
			// to the start of the line there.
			options: { ignoreInputs: true },
		},
	])

	return null
}
