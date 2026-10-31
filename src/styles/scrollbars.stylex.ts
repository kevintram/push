import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from './colors/colorsSemantic.stylex'

// `global.css` styles every scrollbar, which StyleX can't express. Keys that
// start with `--` keep their literal names, so that rule can read these.
export const scrollbarVars = stylex.defineVars({
	'--scrollbar-thumb': colorsSemantic.scrollbarThumb,
	// The width a scrollbar takes from layout: 0 for overlay scrollbars.
	// `trackClassicScrollbars` sets it on `<html>`.
	'--scrollbar-width': '0px',
})
