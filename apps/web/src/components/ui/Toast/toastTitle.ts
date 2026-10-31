import { createElement, Fragment, type ReactNode } from 'react'

// Long enough to recognize a card or collection, short enough for one line of
// a toast.
const MAX_NAME_LENGTH = 32

/**
 * A user's name for something, in bold and cut short with an ellipsis, to set
 * it apart from a toast's own words. A blank name reads as `fallback`.
 */
export function toastName(name: string, fallback = 'Untitled'): ReactNode {
	const trimmed = name.trim() || fallback
	return createElement(
		'strong',
		null,
		trimmed.length > MAX_NAME_LENGTH
			? `${trimmed.slice(0, MAX_NAME_LENGTH - 1).trimEnd()}…`
			: trimmed,
	)
}

/** Joins words and `toastName`s into one title: Moved **Ribosome** to **French**. */
export function toastTitle(...parts: Array<ReactNode>): ReactNode {
	return createElement(Fragment, null, ...parts)
}
