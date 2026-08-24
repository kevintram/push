import * as stylex from '@stylexjs/stylex'

import {
	baseColors,
	blackAlpha,
	blue,
	indigo,
	neutral,
	red,
	whiteAlpha,
} from './primitives.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// Semantic color tokens, tier 2 of the three-tier system (primitives,
// semantic tokens, component tokens). Each token references the color
// primitives in primitives.stylex.ts directly.
export const semanticColors = stylex.defineVars({
	// Surface
	// Structural surfaces
	surfacePrimary: { default: baseColors.white, [DARK]: neutral.s950 },
	surfaceSecondary: { default: neutral.s50, [DARK]: neutral.s900 },
	surfaceRaised: { default: neutral.s200, [DARK]: neutral.s700 },
	surfaceSunken: { default: neutral.s100, [DARK]: neutral.s800 },
	surfaceInverse: { default: neutral.s700, [DARK]: neutral.s700 },
	surfaceBrand: { default: indigo.s600, [DARK]: indigo.s600 },
	surfaceBackdrop: { default: blackAlpha.s70, [DARK]: blackAlpha.s70 },

	// Primary interactive surfaces
	surfaceInteractivePrimary: { default: indigo.s600, [DARK]: indigo.s600 },
	surfaceInteractivePrimaryHover: {
		default: indigo.s700,
		[DARK]: indigo.s500,
	},
	surfaceInteractivePrimaryActive: {
		default: indigo.s700,
		[DARK]: indigo.s500,
	},
	surfaceInteractivePrimaryDisabled: {
		default: blackAlpha.s15,
		[DARK]: whiteAlpha.s20,
	},

	// Secondary interactive surfaces
	surfaceInteractiveSecondary: {
		default: neutral.s100,
		[DARK]: neutral.s900,
	},
	surfaceInteractiveSecondaryHover: {
		default: neutral.s200,
		[DARK]: neutral.s800,
	},
	surfaceInteractiveSecondaryActive: {
		default: neutral.s300,
		[DARK]: neutral.s700,
	},
	surfaceInteractiveSecondaryDisabled: {
		default: blackAlpha.s5,
		[DARK]: whiteAlpha.s5,
	},

	// Danger interactive surfaces
	surfaceInteractiveDanger: { default: red.s50, [DARK]: red.s950 },
	surfaceInteractiveDangerHover: { default: red.s100, [DARK]: red.s900 },
	surfaceInteractiveDangerActive: {
		default: red.s200,
		[DARK]: red.s800,
	},
	surfaceInteractiveDangerDisabled: {
		default: blackAlpha.s5,
		[DARK]: whiteAlpha.s5,
	},

	// Transparent interactive surfaces
	surfaceTransparent: {
		default: baseColors.transparent,
		[DARK]: baseColors.transparent,
	},
	surfaceTransparentHover: {
		default: blackAlpha.s10,
		[DARK]: whiteAlpha.s10,
	},
	surfaceTransparentActive: {
		default: blackAlpha.s15,
		[DARK]: whiteAlpha.s15,
	},

	// Text
	// Neutral text
	textPrimary: { default: baseColors.black, [DARK]: baseColors.white },
	textSecondary: { default: neutral.s600, [DARK]: neutral.s400 },
	textTertiary: { default: neutral.s400, [DARK]: neutral.s500 },
	textDisabled: { default: neutral.s400, [DARK]: neutral.s500 },
	textOnInverse: { default: neutral.s100, [DARK]: neutral.s100 },
	textOnInverseSecondary: { default: neutral.s400, [DARK]: neutral.s400 },

	// Interactive text
	textInteractive: { default: neutral.s600, [DARK]: neutral.s400 },
	textInteractiveHover: {
		default: baseColors.black,
		[DARK]: baseColors.white,
	},
	textInteractiveActive: {
		default: baseColors.black,
		[DARK]: baseColors.white,
	},
	textInteractiveDisabled: { default: neutral.s400, [DARK]: neutral.s500 },

	// Brand text
	textInteractiveBrand: {
		default: baseColors.white,
		[DARK]: baseColors.white,
	},
	textInteractiveBrandHover: {
		default: baseColors.white,
		[DARK]: baseColors.white,
	},
	textInteractiveBrandActive: {
		default: baseColors.white,
		[DARK]: baseColors.white,
	},
	textInteractiveBrandDisabled: {
		default: neutral.s500,
		[DARK]: neutral.s500,
	},
	textOnBrand: { default: baseColors.white, [DARK]: baseColors.white },
	textOnBrandDisabled: { default: neutral.s500, [DARK]: neutral.s500 },

	// Danger text
	textDanger: { default: red.s950, [DARK]: red.s200 },
	textDangerHover: { default: red.s950, [DARK]: red.s200 },
	textDangerActive: { default: red.s950, [DARK]: red.s200 },

	// Border
	borderPrimary: { default: neutral.s300, [DARK]: neutral.s600 },
	borderSubtle: { default: neutral.s200, [DARK]: neutral.s700 },
	borderStrong: { default: neutral.s400, [DARK]: neutral.s500 },
	borderFocus: { default: blue.s600, [DARK]: blue.s500 },
	borderBrand: { default: indigo.s300, [DARK]: indigo.s700 },
	borderDanger: { default: red.s300, [DARK]: red.s700 },
	borderDisabled: { default: neutral.s200, [DARK]: neutral.s800 },

	// Shadow
	shadowSubtle: { default: blackAlpha.s10, [DARK]: blackAlpha.s30 },
	shadowStrong: { default: blackAlpha.s15, [DARK]: blackAlpha.s50 },
})
