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
	// The default application canvas and content background.
	surfacePrimary: { default: baseColors.white, [DARK]: neutral.s950 },
	// A quiet background that separates secondary regions from the primary surface.
	surfaceSecondary: { default: neutral.s100, [DARK]: neutral.s900 },
	// An elevated surface that should appear above its surrounding surface.
	surfaceRaised: { default: neutral.s300, [DARK]: neutral.s700 },
	// A recessed surface that should appear inset beneath its surrounding surface.
	surfaceSunken: { default: neutral.s200, [DARK]: neutral.s800 },
	// A contrast-reversed surface intended to host inverse foreground colors.
	surfaceInverse: { default: neutral.s700, [DARK]: neutral.s700 },
	// A surface that communicates the product's primary brand identity.
	surfaceBrand: { default: indigo.s600, [DARK]: indigo.s600 },
	// A translucent scrim behind overlays that visually suppresses underlying content.
	surfaceBackdrop: { default: blackAlpha.s70, [DARK]: blackAlpha.s70 },

	// Primary interactive surfaces
	// The resting surface for the highest-emphasis interactive action.
	surfaceInteractivePrimary: { default: indigo.s600, [DARK]: indigo.s600 },
	// The primary interactive surface while a pointer is hovering over it.
	surfaceInteractivePrimaryHover: {
		default: indigo.s700,
		[DARK]: indigo.s500,
	},
	// The primary interactive surface while it is being pressed or activated.
	surfaceInteractivePrimaryActive: {
		default: indigo.s700,
		[DARK]: indigo.s500,
	},
	// The primary interactive surface when interaction is unavailable.
	surfaceInteractivePrimaryDisabled: {
		default: blackAlpha.s15,
		[DARK]: whiteAlpha.s20,
	},

	// Secondary interactive surfaces
	// The resting surface for a medium- or low-emphasis interactive action.
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
	// The resting surface for an action with destructive or hazardous consequences.
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
	// A fully transparent resting surface for visually minimal controls.
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
	// The highest-emphasis text used for primary content and headings.
	textPrimary: { default: baseColors.black, [DARK]: baseColors.white },
	// Supporting text with less emphasis than primary content.
	textSecondary: { default: neutral.s600, [DARK]: neutral.s400 },
	// Low-emphasis text for ancillary information.
	textTertiary: { default: neutral.s400, [DARK]: neutral.s500 },
	// Text that communicates its associated content or control is unavailable.
	textDisabled: { default: neutral.s400, [DARK]: neutral.s500 },
	// High-emphasis text placed on a contrast-reversed surface.
	textOnInverse: { default: neutral.s100, [DARK]: neutral.s100 },
	// Supporting text placed on a contrast-reversed surface.
	textOnInverseSecondary: { default: neutral.s400, [DARK]: neutral.s400 },

	// Interactive text
	// The resting color for text that signals an available interaction.
	textInteractive: { default: neutral.s600, [DARK]: neutral.s400 },
	textInteractiveHover: {
		default: baseColors.black,
		[DARK]: baseColors.white,
	},
	textInteractiveActive: {
		default: baseColors.black,
		[DARK]: baseColors.white,
	},
	// Interactive text when its action is unavailable.
	textInteractiveDisabled: { default: neutral.s400, [DARK]: neutral.s500 },

	// Brand text
	// The resting foreground for text on a brand-colored interactive surface.
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
	// Text for a brand-colored interactive action that is unavailable.
	textInteractiveBrandDisabled: {
		default: neutral.s500,
		[DARK]: neutral.s500,
	},
	// High-emphasis text or iconography placed on a brand surface.
	textOnBrand: { default: baseColors.white, [DARK]: baseColors.white },
	// Disabled text or iconography placed on a brand surface.
	textOnBrandDisabled: { default: neutral.s500, [DARK]: neutral.s500 },

	// Danger text
	// Text that communicates an error, danger, or destructive consequence.
	textDanger: { default: red.s950, [DARK]: red.s200 },
	textDangerHover: { default: red.s950, [DARK]: red.s200 },
	textDangerActive: { default: red.s950, [DARK]: red.s200 },

	// Border
	// The default boundary used to clearly separate adjacent elements or surfaces.
	borderPrimary: { default: neutral.s300, [DARK]: neutral.s600 },
	// A low-emphasis boundary for gentle visual separation.
	borderSubtle: { default: neutral.s200, [DARK]: neutral.s700 },
	// A high-emphasis boundary for pronounced separation or containment.
	borderStrong: { default: neutral.s400, [DARK]: neutral.s500 },
	// The boundary color that identifies keyboard or input focus.
	borderFocus: { default: blue.s600, [DARK]: blue.s500 },
	// A boundary that communicates brand identity or brand emphasis.
	borderBrand: { default: indigo.s300, [DARK]: indigo.s700 },
	// A boundary that communicates an error, danger, or destructive state.
	borderDanger: { default: red.s300, [DARK]: red.s700 },
	// A subdued boundary for an element that is unavailable.
	borderDisabled: { default: neutral.s200, [DARK]: neutral.s800 },

	// Shadow
	// A low-emphasis shadow for gentle depth and surface separation.
	shadowSubtle: { default: blackAlpha.s10, [DARK]: blackAlpha.s30 },
	// A high-emphasis shadow for pronounced elevation and separation.
	shadowStrong: { default: blackAlpha.s15, [DARK]: blackAlpha.s50 },
})
