import * as stylex from '@stylexjs/stylex'

import { colors } from './colors.stylex'

// Semantic color tokens, tier 2 of the three-tier system (primitives,
// semantic tokens, component tokens). Each token references its equivalent
// in colors.stylex.ts.
export const colorsV2 = stylex.defineVars({
	// Surface
	// Structural surfaces
	surfacePrimary: colors.bgSurface,
	surfaceSecondary: colors.bgSurfaceSecondary,
	surfaceRaised: colors.bgSurface,
	surfaceSunken: colors.navBg,
	surfaceInverse: colors.bgFillInverse,
	surfaceBrand: colors.bgFillBrand,
	surfaceBackdrop: colors.backdropBg,

	// Primary interactive surfaces
	surfaceInteractivePrimary: colors.bgFillBrand,
	surfaceInteractivePrimaryHover: colors.bgFillBrandHover,
	surfaceInteractivePrimaryActive: colors.bgFillBrandActive,
	surfaceInteractivePrimaryDisabled: colors.bgFillBrandDisabled,

	// Secondary interactive surfaces
	surfaceInteractiveSecondary: colors.bgFillSecondary,
	surfaceInteractiveSecondaryHover: colors.bgFillSecondaryHover,
	surfaceInteractiveSecondaryActive: colors.bgFillSecondaryActive,
	surfaceInteractiveSecondaryDisabled: colors.bgFillDisabled,

	// Danger interactive surfaces
	surfaceInteractiveDanger: colors.bgFillDangerSecondary,
	surfaceInteractiveDangerHover: colors.bgFillDangerSecondaryHover,
	surfaceInteractiveDangerActive: colors.bgFillDangerSecondaryActive,
	surfaceInteractiveDangerDisabled: colors.bgFillDisabled,

	// Transparent interactive surfaces
	surfaceTransparent: colors.bgSurfaceTransparent,
	surfaceTransparentHover: colors.bgFillTransparentHover,
	surfaceTransparentActive: colors.bgFillTransparentActive,

	// Text
	// Neutral text
	textPrimary: colors.text,
	textSecondary: colors.textSecondary,
	textTertiary: colors.textDisabled,
	textDisabled: colors.textDisabled,
	textOnInverse: colors.textInverse,
	textOnInverseSecondary: colors.textInverseSecondary,

	// Interactive text
	textInteractive: colors.textInteractive,
	textInteractiveHover: colors.textInteractiveHover,
	textInteractiveActive: colors.textInteractiveActive,
	textInteractiveDisabled: colors.textDisabled,

	// Brand text
	textInteractiveBrand: colors.textBrandOnBgFill,
	textInteractiveBrandHover: colors.textBrandOnBgFillHover,
	textInteractiveBrandActive: colors.textBrandOnBgFillActive,
	textInteractiveBrandDisabled: colors.textBrandOnBgFillDisabled,
	textOnBrand: colors.textBrandOnBgFill,
	textOnBrandDisabled: colors.textBrandOnBgFillDisabled,

	// Danger text
	textDanger: colors.textDanger,
	textDangerHover: colors.textDangerHover,
	textDangerActive: colors.textDangerActive,

	// Border
	borderPrimary: colors.border,
	borderSubtle: colors.borderSecondary,
	borderStrong: colors.borderHover,
	borderFocus: colors.borderFocus,
	borderBrand: colors.borderBrand,
	borderDanger: colors.borderDanger,
	borderDisabled: colors.borderDisabled,

	// Shadow
	shadowSubtle: colors.shadowSubtle,
	shadowStrong: colors.shadowStrong,
})
