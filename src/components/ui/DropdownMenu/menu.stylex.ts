import * as stylex from '@stylexjs/stylex'

// Set by the menu popup. When any item fills the leading column with an
// icon, checkmark, or radio dot, every row starts its label past the column
// so labels line up.
export const menuVars = stylex.defineVars({
	labelInsetStart: '8px',
})
