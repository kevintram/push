import * as stylex from '@stylexjs/stylex'

import { blue, slate, whiteAlpha } from '~/styles/colors/primitives.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// The hide-mode palette for the blue-gray chrome. It overrides only the tokens
// the sidebar renders; portaled surfaces like menus and tooltips never see it.
// Interactive text uses the secondary step and disabled text the tertiary step,
// as in the base scale, so hierarchy reads the same as outside hide mode.
export const hideModeSidebarTheme = stylex.createTheme(semanticColors, {
	// Opaque so the drag chip hides the rows under it.
	surfaceTertiary: { default: slate.s600, [DARK]: slate.s800 },
	// Light, to sit behind the dark textOnInverse below.
	surfaceInverse: slate.s100,
	surfaceTransparentHover: whiteAlpha.s10,
	surfaceTransparentActive: whiteAlpha.s15,

	textPrimary: whiteAlpha.s95,
	textTertiary: { default: slate.s400, [DARK]: slate.s500 },
	textOnInverse: slate.s900,
	textOnInverseSecondary: slate.s400,
	textInteractive: { default: slate.s300, [DARK]: slate.s400 },
	textInteractiveHover: whiteAlpha.s95,
	textInteractiveActive: whiteAlpha.s95,
	textInteractiveDisabled: { default: slate.s400, [DARK]: slate.s500 },

	borderSubtle: whiteAlpha.s10,
	borderFocus: blue.s300,
})

// The hide-mode sidebar background, for the shell and for sidebar popups that
// portal out of it. Pair with hideModeSidebarTheme on the same element.
export const hideModeSidebarStyles = stylex.create({
	surface: {
		backgroundColor: { [DARK]: slate.s900, default: slate.s700 },
	},
	// Drops the popup border to the theme's subtle step so it doesn't glow
	// against the dark fill.
	popup: {
		borderColor: semanticColors.borderSubtle,
	},
})
