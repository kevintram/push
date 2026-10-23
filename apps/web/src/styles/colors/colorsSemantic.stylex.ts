import * as stylex from '@stylexjs/stylex'

import {
	baseColors,
	blackAlpha,
	blue,
	green,
	indigo,
	neutral,
	red,
	rose,
	whiteAlpha,
} from './colorsPrimitive.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// Semantic color tokens, tier 2 of the color system. Components consume these
// tokens directly; each token references colorsPrimitive.stylex.ts.
export const colorsSemantic = stylex.defineVars({
	// Surface
	// Structural surfaces
	// The default application canvas and content background.
	surfacePrimary: { default: neutral.s50, [DARK]: neutral.s950 },
	// A quiet background that separates secondary regions from the primary surface.
	surfaceSecondary: { default: neutral.s100, [DARK]: neutral.s900 },
	// A third background level that separates nested regions from secondary surfaces.
	surfaceTertiary: { default: neutral.s150, [DARK]: neutral.s850 },
	// An elevated surface that should appear above its surrounding surface.
	surfaceRaised: { default: neutral.s100, [DARK]: neutral.s900 },
	// A recessed surface that should appear inset beneath its surrounding surface.
	surfaceSunken: { default: neutral.s100, [DARK]: neutral.s900 },
	// A contrast-reversed surface intended to host inverse foreground colors.
	surfaceInverse: { default: neutral.s900, [DARK]: neutral.s50 },
	// A surface that communicates the product's primary brand identity.
	surfaceBrand: { default: indigo.s600, [DARK]: indigo.s600 },
	// A surface that communicates an error, danger, or destructive consequence.
	surfaceDanger: { default: red.s200, [DARK]: red.s950 },
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
	surfaceInteractiveDanger: { default: red.s500, [DARK]: red.s800 },
	surfaceInteractiveDangerHover: { default: red.s600, [DARK]: red.s600 },
	surfaceInteractiveDangerActive: {
		default: red.s600,
		[DARK]: red.s600,
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
	textOnInverse: { default: neutral.s50, [DARK]: neutral.s900 },
	// Supporting text placed on a contrast-reversed surface.
	textOnInverseSecondary: { default: neutral.s400, [DARK]: neutral.s600 },

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

	// Status text
	// Text that communicates a successful or positive outcome.
	textSuccess: { default: green.s600, [DARK]: green.s300 },
	// Text that marks content scheduled for the current day, such as a review
	// that comes due today.
	textToday: { default: blue.s600, [DARK]: blue.s400 },
	// Danger text
	// Text that communicates an error, danger, or destructive consequence.
	textDanger: { default: rose.s600, [DARK]: rose.s300 },
	// High-emphasis text or iconography placed on a danger surface.
	textOnDanger: { default: baseColors.white, [DARK]: baseColors.white },

	// Border
	// The default boundary used to clearly separate adjacent elements or surfaces.
	borderPrimary: { default: neutral.s300, [DARK]: neutral.s700 },
	// A low-emphasis boundary for gentle visual separation.
	borderSubtle: { default: neutral.s200, [DARK]: neutral.s800 },
	// The boundary color that identifies keyboard or input focus.
	borderFocus: { default: blue.s600, [DARK]: blue.s500 },
	// A boundary that communicates brand identity or brand emphasis.
	borderBrand: { default: indigo.s300, [DARK]: indigo.s700 },
	// A boundary that communicates an error, danger, or destructive state.
	borderDanger: { default: red.s300, [DARK]: red.s700 },
	// A subdued boundary for an element that is unavailable.
	borderDisabled: { default: neutral.s200, [DARK]: neutral.s800 },

	// Shadow
	// The default shadow for depth and surface separation.
	shadowPrimary: { default: blackAlpha.s10, [DARK]: blackAlpha.s30 },
	// A low-emphasis shadow for surfaces that sit flush within a container.
	shadowSubtle: { default: blackAlpha.s5, [DARK]: blackAlpha.s20 },
	// A high-emphasis shadow for pronounced elevation and separation.
	shadowStrong: { default: blackAlpha.s15, [DARK]: blackAlpha.s50 },
})
