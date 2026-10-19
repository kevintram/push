import * as stylex from '@stylexjs/stylex'

import { blue, slate, whiteAlpha } from '~/styles/colors/primitives.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// The hide-mode palette for the blue-gray chrome. Text steps mirror the base
// semantic scale (interactive matches secondary; disabled matches tertiary)
// so hierarchy and disabled states read the same as outside hide mode.
export const hideModeSidebarTheme = stylex.createTheme(semanticColors, {
	surfaceSecondary: whiteAlpha.s5,
	surfaceRaised: whiteAlpha.s10,
	surfaceSunken: whiteAlpha.s5,
	surfaceTransparentHover: whiteAlpha.s10,
	surfaceTransparentActive: whiteAlpha.s15,
	surfaceInteractiveSecondary: whiteAlpha.s10,
	surfaceInteractiveSecondaryHover: whiteAlpha.s15,
	surfaceInteractiveSecondaryActive: whiteAlpha.s20,

	textPrimary: whiteAlpha.s95,
	textSecondary: { default: slate.s300, [DARK]: slate.s400 },
	textTertiary: { default: slate.s400, [DARK]: slate.s500 },
	textDisabled: { default: slate.s400, [DARK]: slate.s500 },
	textOnInverse: slate.s900,
	textOnInverseSecondary: slate.s400,
	textInteractive: { default: slate.s300, [DARK]: slate.s400 },
	textInteractiveHover: whiteAlpha.s95,
	textInteractiveActive: whiteAlpha.s95,
	textInteractiveDisabled: { default: slate.s400, [DARK]: slate.s500 },

	borderPrimary: whiteAlpha.s20,
	borderSubtle: whiteAlpha.s10,
	borderStrong: whiteAlpha.s30,
	borderFocus: blue.s300,
})
