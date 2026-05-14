export const OPEN_SETTINGS_EVENT = '3gulp:open-settings'

export function openSettingsDialog() {
	window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))
}
