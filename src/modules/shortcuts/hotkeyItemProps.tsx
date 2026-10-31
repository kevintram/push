import { type AppHotkey } from '@tanstack/react-hotkeys'

import { ariaKeyShortcuts } from './ariaKeyShortcuts'
import { ShortcutKeys } from './components/ShortcutKeys'

/**
 * Props that show an app hotkey's keys in a menu item's trailing column and
 * announce them through `aria-keyshortcuts`. Empty while the hotkey is unbound.
 */
export function hotkeyItemProps(appHotkey: AppHotkey) {
	if (appHotkey.hotkey === null) return {}
	return {
		trailing: <ShortcutKeys hotkey={appHotkey} aria-hidden />,
		'aria-keyshortcuts': ariaKeyShortcuts(appHotkey),
	}
}
