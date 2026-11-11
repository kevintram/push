import { defineAppHotkeys } from '@tanstack/react-hotkeys'

/** Groups in the order the shortcut reference lists them. */
export const HOTKEY_GROUPS = [
	'General',
	'Go to',
	'Card',
	'Review composer',
	'Rating',
	'Review queue',
	'Collection',
] as const

export type HotkeyGroup = (typeof HOTKEY_GROUPS)[number]

/**
 * Every keyboard shortcut in the app. Bindings, hints, and the shortcut
 * reference all read their keys from here, so they cannot drift apart. Each
 * one is still registered with `useHotkey` by the component that owns its
 * scope, so it works only while that component is mounted.
 */
export const appHotkeys = defineAppHotkeys({
	toggleSidebar: {
		hotkey: 'Mod+B',
		meta: { name: 'Toggle sidebar', group: 'General' },
	},
	openSearch: {
		hotkey: 'Mod+K',
		meta: { name: 'Search', group: 'General' },
	},
	toggleHideMode: {
		hotkey: 'Shift+R',
		meta: { name: 'Hide or show answers and notes', group: 'General' },
	},
	openShortcuts: {
		hotkey: 'Mod+/',
		meta: { name: 'Keyboard shortcuts', group: 'General' },
	},
	stopEditing: {
		hotkey: 'Escape',
		meta: { name: 'Stop editing a text field', group: 'General' },
	},
	resumeEditing: {
		hotkey: 'Enter',
		meta: { name: 'Edit the focused text field', group: 'General' },
	},

	goToDue: { hotkey: ['G', 'D'], meta: { name: 'Due', group: 'Go to' } },
	goToNew: { hotkey: ['G', 'N'], meta: { name: 'New', group: 'Go to' } },
	goToLate: { hotkey: ['G', 'L'], meta: { name: 'Late', group: 'Go to' } },
	goToFlagged: {
		hotkey: ['G', 'F'],
		meta: { name: 'Flagged', group: 'Go to' },
	},

	newReview: { hotkey: 'C', meta: { name: 'New review', group: 'Card' } },
	openDatePicker: {
		hotkey: 'S',
		meta: { name: 'Change review date', group: 'Card' },
	},
	rateMiss: { hotkey: '1', meta: { name: 'Miss', group: 'Rating' } },
	rateHard: { hotkey: '2', meta: { name: 'Hard', group: 'Rating' } },
	rateGood: { hotkey: '3', meta: { name: 'Good', group: 'Rating' } },
	rateEasy: { hotkey: '4', meta: { name: 'Easy', group: 'Rating' } },
	rateTodo: { hotkey: '0', meta: { name: 'Todo', group: 'Rating' } },
	reveal: {
		hotkey: 'R',
		meta: { name: 'Reveal answer, then notes', group: 'Card' },
	},
	toggleFlag: {
		hotkey: 'F',
		meta: { name: 'Flag or unflag', group: 'Card' },
	},
	moveCard: { hotkey: 'M', meta: { name: 'Move', group: 'Card' } },
	toggleRetire: {
		hotkey: 'E',
		meta: { name: 'Retire or unretire', group: 'Card' },
	},
	deleteCard: {
		hotkey: 'Mod+Backspace',
		meta: { name: 'Delete', group: 'Card' },
	},
	showOverview: {
		hotkey: '1',
		meta: { name: 'Show Overview', group: 'Card' },
	},
	showReviews: {
		hotkey: '2',
		meta: { name: 'Show Reviews', group: 'Card' },
	},
	toggleDetails: {
		hotkey: 'D',
		meta: { name: 'Show or hide details', group: 'Card' },
	},

	createReview: {
		hotkey: 'Mod+Enter',
		meta: { name: 'Create review', group: 'Review composer' },
	},
	minimizeComposer: {
		hotkey: 'Escape',
		meta: { name: 'Minimize', group: 'Review composer' },
	},

	nextCard: {
		hotkey: 'J',
		meta: { name: 'Next card', group: 'Review queue' },
	},
	previousCard: {
		hotkey: 'K',
		meta: { name: 'Previous card', group: 'Review queue' },
	},
	toggleQueue: {
		hotkey: 'Q',
		meta: { name: 'Show or hide queue', group: 'Review queue' },
	},

	selectPrevious: {
		hotkey: 'ArrowUp',
		meta: { name: 'Select previous', group: 'Collection' },
	},
	selectNext: {
		hotkey: 'ArrowDown',
		meta: { name: 'Select next', group: 'Collection' },
	},
	extendSelectionUp: {
		hotkey: 'Shift+ArrowUp',
		meta: { name: 'Extend selection up', group: 'Collection' },
	},
	extendSelectionDown: {
		hotkey: 'Shift+ArrowDown',
		meta: { name: 'Extend selection down', group: 'Collection' },
	},
	selectAll: {
		hotkey: 'Mod+A',
		meta: { name: 'Select all', group: 'Collection' },
	},
	moveSelectionUp: {
		hotkey: 'Mod+ArrowUp',
		meta: { name: 'Move up', group: 'Collection' },
	},
	moveSelectionDown: {
		hotkey: 'Mod+ArrowDown',
		meta: { name: 'Move down', group: 'Collection' },
	},
	moveSelectionToTop: {
		hotkey: 'Mod+Alt+ArrowUp',
		meta: { name: 'Move to top', group: 'Collection' },
	},
	moveSelectionToBottom: {
		hotkey: 'Mod+Alt+ArrowDown',
		meta: { name: 'Move to bottom', group: 'Collection' },
	},
	openSelection: {
		hotkey: 'Enter',
		meta: { name: 'Open card or rename section', group: 'Collection' },
	},
	clearSelection: {
		hotkey: 'Escape',
		meta: { name: 'Clear selection', group: 'Collection' },
	},
	createCard: {
		hotkey: 'C',
		meta: { name: 'Create card', group: 'Collection' },
	},
	createSection: {
		hotkey: 'Shift+C',
		meta: { name: 'Create section', group: 'Collection' },
	},
	createSubcollection: {
		hotkey: 'Alt+C',
		meta: { name: 'Create subcollection', group: 'Collection' },
	},
	toggleSelectionFlag: {
		hotkey: 'F',
		meta: { name: 'Flag or unflag selection', group: 'Collection' },
	},
	moveSelection: {
		hotkey: 'M',
		meta: { name: 'Move selection', group: 'Collection' },
	},
	toggleSelectionRetire: {
		hotkey: 'E',
		meta: { name: 'Retire or unretire selection', group: 'Collection' },
	},
	deleteSelection: {
		hotkey: 'Mod+Backspace',
		meta: { name: 'Delete selection', group: 'Collection' },
	},
})
