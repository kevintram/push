import type { KeyboardEvent } from 'react'

const TAB_STOPS = [
	'a[href]',
	'button',
	'input',
	'select',
	'textarea',
	'[tabindex]',
]
	.map(selector => `${selector}:not([disabled]):not([tabindex^="-"])`)
	.join(',')

/**
 * Keeps Tab cycling inside a non-modal window: Tab from its last stop goes to
 * its first, and Shift+Tab from its first goes to its last. Every other Tab,
 * including from portaled children, is the browser's.
 */
export function wrapTab(event: KeyboardEvent<HTMLElement>) {
	if (event.key !== 'Tab') return
	const container = event.currentTarget
	const stops = container.querySelectorAll<HTMLElement>(TAB_STOPS)
	const first = stops[0]
	const last = stops[stops.length - 1]
	const active = document.activeElement
	// The window itself takes focus from a click on its frame.
	const isAtEdge = event.shiftKey
		? active === first || active === container
		: active === last
	if (!isAtEdge) return

	event.preventDefault()
	;(event.shiftKey ? last : first)?.focus()
}
