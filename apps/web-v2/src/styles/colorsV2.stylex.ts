import * as stylex from '@stylexjs/stylex'

import {
	baseColors,
	blackAlpha,
	blueDark,
	blueLight,
	grayDark,
	grayLight,
	irisDark,
	irisLight,
	redDark,
	redLight,
	whiteAlpha,
} from './colorPrimitives.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// Semantic color tokens, tier 2 of the three-tier system (primitives,
// semantic tokens, component tokens). Each token references the color
// primitives in colorPrimitives.stylex.ts directly.
export const colorsV2 = stylex.defineVars({
	// Surface
	// Structural surfaces
	surfacePrimary: { default: grayLight.s3, [DARK]: grayDark.s3 },
	surfaceSecondary: { default: grayLight.s2, [DARK]: grayDark.s2 },
	surfaceRaised: { default: grayLight.s3, [DARK]: grayDark.s3 },
	surfaceSunken: { default: grayLight.s1, [DARK]: grayDark.s1 },
	surfaceInverse: { default: grayDark.s5, [DARK]: grayDark.s5 },
	surfaceBrand: { default: irisLight.s9, [DARK]: irisDark.s9 },
	surfaceBackdrop: { default: blackAlpha.s9, [DARK]: blackAlpha.s9 },

	// Primary interactive surfaces
	surfaceInteractivePrimary: { default: irisLight.s9, [DARK]: irisDark.s9 },
	surfaceInteractivePrimaryHover: {
		default: irisLight.s10,
		[DARK]: irisDark.s10,
	},
	surfaceInteractivePrimaryActive: {
		default: irisLight.s10,
		[DARK]: irisDark.s10,
	},
	surfaceInteractivePrimaryDisabled: {
		default: blackAlpha.s3,
		[DARK]: whiteAlpha.s4,
	},

	// Secondary interactive surfaces
	surfaceInteractiveSecondary: { default: grayLight.s3, [DARK]: grayDark.s2 },
	surfaceInteractiveSecondaryHover: {
		default: grayLight.s4,
		[DARK]: grayDark.s4,
	},
	surfaceInteractiveSecondaryActive: {
		default: grayLight.s5,
		[DARK]: grayDark.s5,
	},
	surfaceInteractiveSecondaryDisabled: {
		default: blackAlpha.s1,
		[DARK]: whiteAlpha.s1,
	},

	// Danger interactive surfaces
	surfaceInteractiveDanger: { default: redLight.s3, [DARK]: redDark.s3 },
	surfaceInteractiveDangerHover: { default: redLight.s4, [DARK]: redDark.s4 },
	surfaceInteractiveDangerActive: {
		default: redLight.s5,
		[DARK]: redDark.s5,
	},
	surfaceInteractiveDangerDisabled: {
		default: blackAlpha.s1,
		[DARK]: whiteAlpha.s1,
	},

	// Transparent interactive surfaces
	surfaceTransparent: {
		default: baseColors.transparent,
		[DARK]: baseColors.transparent,
	},
	surfaceTransparentHover: { default: blackAlpha.s2, [DARK]: whiteAlpha.s2 },
	surfaceTransparentActive: { default: blackAlpha.s3, [DARK]: whiteAlpha.s3 },

	// Text
	// Neutral text
	textPrimary: { default: baseColors.black, [DARK]: baseColors.white },
	textSecondary: { default: grayLight.s11, [DARK]: grayDark.s11 },
	textTertiary: { default: grayLight.s8, [DARK]: grayDark.s8 },
	textDisabled: { default: grayLight.s8, [DARK]: grayDark.s8 },
	textOnInverse: { default: grayDark.s12, [DARK]: grayDark.s12 },
	textOnInverseSecondary: { default: grayDark.s11, [DARK]: grayDark.s11 },

	// Interactive text
	textInteractive: { default: grayLight.s11, [DARK]: grayDark.s11 },
	textInteractiveHover: {
		default: baseColors.black,
		[DARK]: baseColors.white,
	},
	textInteractiveActive: {
		default: baseColors.black,
		[DARK]: baseColors.white,
	},
	textInteractiveDisabled: { default: grayLight.s8, [DARK]: grayDark.s8 },

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
	textInteractiveBrandDisabled: { default: grayDark.s8, [DARK]: grayDark.s8 },
	textOnBrand: { default: baseColors.white, [DARK]: baseColors.white },
	textOnBrandDisabled: { default: grayDark.s8, [DARK]: grayDark.s8 },

	// Danger text
	textDanger: { default: redLight.s12, [DARK]: redDark.s12 },
	textDangerHover: { default: redLight.s12, [DARK]: redDark.s12 },
	textDangerActive: { default: redLight.s12, [DARK]: redDark.s12 },

	// Border
	borderPrimary: { default: grayLight.s7, [DARK]: grayDark.s7 },
	borderSubtle: { default: grayLight.s6, [DARK]: grayDark.s6 },
	borderStrong: { default: grayLight.s8, [DARK]: grayDark.s8 },
	borderFocus: { default: blueLight.s11, [DARK]: blueDark.s9 },
	borderBrand: { default: irisLight.s7, [DARK]: irisDark.s7 },
	borderDanger: { default: redLight.s7, [DARK]: redDark.s7 },
	borderDisabled: { default: grayLight.s4, [DARK]: grayDark.s4 },

	// Shadow
	shadowSubtle: { default: blackAlpha.s2, [DARK]: blackAlpha.s5 },
	shadowStrong: { default: blackAlpha.s3, [DARK]: blackAlpha.s7 },
})
