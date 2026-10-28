import * as stylex from '@stylexjs/stylex'

export const collectionsNavigationVars = stylex.defineVars({
	// The end padding of whatever holds the navigation. The tree's scroller
	// reaches through it so its scrollbar sits on the holder's edge, as in
	// Linear, and pads its rows back in by whatever the scrollbar leaves.
	edgeInset: '0px',
})
