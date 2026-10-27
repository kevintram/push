import * as stylex from '@stylexjs/stylex'

/**
 * Shared by card rows and the list header so their columns line up. Below the
 * `wide` width, rows fall back to the stacked layout.
 */
export const cardTable = stylex.defineConsts({
	wide: '@container (min-width: 560px)',
	// Stacked rows run out of room for the whole metadata line, so the
	// strength drops first.
	noStrength: '@container (width < 280px)',
	// Title, due, last reviewed, strength, and actions. The actions column
	// sizes to the widest row, since rows show a toggle per active state.
	columns: 'minmax(0, 1fr) 112px 112px 80px max-content',
})

/**
 * Marks the whole table, so the header labels can show while any part of it
 * is hovered. Rows keep the default marker for their own actions.
 */
export const cardTableMarker = stylex.defineMarker()
