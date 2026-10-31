import {
	type AppHotkey,
	detectPlatform,
	isHotkeySequence,
	parseHotkey,
} from '@tanstack/react-hotkeys'

/**
 * An app hotkey as an `aria-keyshortcuts` value, such as `Meta+K`. Undefined
 * while the hotkey is unbound or a sequence, which the attribute can't express.
 */
export function ariaKeyShortcuts(appHotkey: AppHotkey): string | undefined {
	const { hotkey } = appHotkey
	if (hotkey === null || isHotkeySequence(hotkey)) return undefined
	const { key, modifiers } = parseHotkey(hotkey, detectPlatform())
	return [...modifiers, key].join('+')
}
