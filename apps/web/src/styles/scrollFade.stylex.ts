import * as stylex from '@stylexjs/stylex'

// Settings for `scrollFade` in `scrollFade.ts`. Override them per scroll
// container.
export const scrollFadeVars = stylex.defineVars({
	// Full fade depth.
	size: '24px',
	// Scroll distance over which an edge fades in or out.
	reveal: '96px',
})
