const OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"]'

/**
 * Whether a key was pressed inside a dialog, popover, or menu, which owns its
 * keys over the page beneath it.
 */
export function isInsideOverlay(event: KeyboardEvent): boolean {
	return (
		event.target instanceof Element &&
		event.target.closest(OVERLAY_SELECTOR) !== null
	)
}
