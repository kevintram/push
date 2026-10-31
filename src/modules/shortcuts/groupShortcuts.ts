import type { AppHotkeyListItem } from '@tanstack/react-hotkeys'

import { HOTKEY_GROUPS, type HotkeyGroup } from './appHotkeys'

export type ShortcutGroup = {
	group: HotkeyGroup
	items: ReadonlyArray<AppHotkeyListItem>
	/** Whether any of its shortcuts is registered on the current page. */
	isOnPage: boolean
}

/**
 * The shortcut reference's sections: each group's bound shortcuts in
 * declaration order, with the groups the current page registers first.
 */
export function groupShortcuts(
	items: ReadonlyArray<AppHotkeyListItem>,
): Array<ShortcutGroup> {
	const groups = HOTKEY_GROUPS.map(group => {
		const groupItems = items.filter(
			item =>
				item.appHotkey.meta?.group === group &&
				item.status !== 'unbound',
		)
		return {
			group,
			items: groupItems,
			isOnPage: groupItems.some(item => item.status !== 'inactive'),
		}
	}).filter(({ items: groupItems }) => groupItems.length > 0)

	return [
		...groups.filter(({ isOnPage }) => isOnPage),
		...groups.filter(({ isOnPage }) => !isOnPage),
	]
}
