import * as stylex from '@stylexjs/stylex'

/**
 * Shared by review rows and the list header so their columns line up. Below
 * the `wide` width, rows fall back to the stacked layout and the header is
 * visually hidden.
 */
export const reviewTable = stylex.defineConsts({
	wide: '@container (min-width: 560px)',
	stacked: '@container (width < 560px)',
	// Stacked rows run out of room for the date and strength on one line, so
	// the strength change drops first, then the strength itself.
	noStrengthChange: '@container (width < 300px)',
	noStrength: '@container (width < 280px)',
	// Rating, description, notes, date, strength, and actions. The rating and
	// actions columns match `buttonSizes.micro` and the notes column matches
	// `iconSizes.sm`, inlined because constants must be static.
	columns: '1.625rem minmax(0, 1fr) 1rem 100px 112px 1.625rem',
	areas: `'rating description notes date strength actions'`,
})
