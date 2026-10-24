import * as stylex from '@stylexjs/stylex'

// Settings for `textFade` in `textFade.ts`. Override them per element.
export const textFadeVars = stylex.defineVars({
	// Width of the fade. The text's end padding matches it.
	size: '24px',
	// Space kept clear past the fade, such as for a button over the text's end.
	inset: '0px',
})
