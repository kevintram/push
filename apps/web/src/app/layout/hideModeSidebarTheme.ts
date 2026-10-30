import * as stylex from '@stylexjs/stylex'

import { blue, slate, whiteAlpha } from '~/styles/colors/colorsPrimitive.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// The hide-mode palette for the blue-gray chrome. It overrides only the tokens
// the sidebar renders; portaled surfaces like menus and tooltips never see it.
// Interactive text uses the secondary step and disabled text the tertiary step,
// as in the base scale, so hierarchy reads the same as outside hide mode.
export const hideModeSidebarTheme = stylex.createTheme(colorsSemantic, {
	// Opaque so the drag chip hides the rows under it.
	surfaceTertiary: { default: slate.s600, [DARK]: slate.s800 },
	surfaceTransparentHover: whiteAlpha.s10,
	surfaceTransparentActive: whiteAlpha.s15,

	textPrimary: whiteAlpha.s95,
	textTertiary: { default: slate.s400, [DARK]: slate.s500 },
	textInteractive: { default: slate.s300, [DARK]: slate.s400 },
	textInteractiveHover: whiteAlpha.s95,
	textInteractiveActive: whiteAlpha.s95,
	textInteractiveDisabled: { default: slate.s400, [DARK]: slate.s500 },

	borderSubtle: whiteAlpha.s10,
	borderInteractive: whiteAlpha.s10,
	borderInteractiveHover: whiteAlpha.s30,
	borderInteractiveActive: whiteAlpha.s50,
	borderFocus: blue.s300,
})
