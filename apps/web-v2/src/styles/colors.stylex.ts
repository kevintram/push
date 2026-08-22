import * as stylex from '@stylexjs/stylex'

import {
	amberDark,
	amberLight,
	baseColors,
	blackAlpha,
	blueDark,
	blueLight,
	grayAlphaDark,
	grayAlphaLight,
	grayDark,
	grayLight,
	greenDark,
	greenLight,
	irisDark,
	irisLight,
	orangeDark,
	orangeLight,
	redAlphaDark,
	redAlphaLight,
	redDark,
	redLight,
	whiteAlpha,
} from './colorPrimitives.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// Semantic color tokens grouped by visual role. Each token provides a light
// default and a dark-mode override through the media query above.
export const colors = stylex.defineVars({
	// Background
	// Base
	// The default background color of the admin.
	bg: { default: grayLight.s1, [DARK]: grayDark.s1 },
	// Use for high contrast page or component backgrounds.
	bgInverse: { default: grayDark.s1, [DARK]: grayDark.s1 },

	// Surfaces
	// The background color for elements with the highest level of prominence, like a card.
	bgSurface: { default: grayLight.s3, [DARK]: grayDark.s3 },
	// The hover state color for elements with the highest level of prominence.
	bgSurfaceHover: { default: grayLight.s4, [DARK]: grayDark.s4 },
	// The active state (on press) color for elements with the highest level of prominence.
	bgSurfaceActive: { default: grayLight.s5, [DARK]: grayDark.s5 },
	// The selected state color for elements with the highest level of prominence.
	bgSurfaceSelected: { default: grayLight.s5, [DARK]: grayDark.s5 },
	// The disabled state color for elements.
	bgSurfaceDisabled: { default: blackAlpha.s1, [DARK]: whiteAlpha.s1 },
	// The background color for elements with a secondary level of prominence.
	bgSurfaceSecondary: { default: grayLight.s2, [DARK]: grayDark.s2 },
	// The hover state color for elements with a secondary level of prominence.
	bgSurfaceSecondaryHover: {
		default: grayLight.s4,
		[DARK]: grayDark.s4,
	},
	// The active state (on press) color for elements with a secondary level of prominence.
	bgSurfaceSecondaryActive: {
		default: grayLight.s5,
		[DARK]: grayDark.s5,
	},
	// The selected state color for elements with a secondary level of prominence.
	bgSurfaceSecondarySelected: {
		default: grayLight.s5,
		[DARK]: grayDark.s5,
	},

	// Semantic surfaces
	// Use for backgrounds communicating important information, like banners.
	bgSurfaceInfo: { default: blueLight.s3, [DARK]: blueDark.s3 },
	// The hover state color for communicating important information.
	bgSurfaceInfoHover: { default: blueLight.s4, [DARK]: blueDark.s4 },
	// The active state (on press) color for communicating important information.
	bgSurfaceInfoActive: { default: blueLight.s5, [DARK]: blueDark.s5 },
	// Use for backgrounds communicating success, like banners.
	bgSurfaceSuccess: { default: greenLight.s3, [DARK]: greenDark.s3 },
	// The hover state color for communicating success.
	bgSurfaceSuccessHover: {
		default: greenLight.s4,
		[DARK]: greenDark.s4,
	},
	// The active state (on press) color for communicating success.
	bgSurfaceSuccessActive: {
		default: greenLight.s5,
		[DARK]: greenDark.s5,
	},
	// Use for backgrounds communicating warning, like banners.
	bgSurfaceWarning: {
		default: orangeLight.s3,
		[DARK]: orangeDark.s3,
	},
	// The hover state color for communicating warning.
	bgSurfaceWarningHover: {
		default: orangeLight.s4,
		[DARK]: orangeDark.s4,
	},
	// The active state (on press) color for communicating warning.
	bgSurfaceWarningActive: {
		default: orangeLight.s5,
		[DARK]: orangeDark.s5,
	},
	// Use for backgrounds communicating critical information, like banners or input errors.
	bgSurfaceDanger: { default: redLight.s3, [DARK]: redDark.s3 },
	// The hover state color for communicating critical information.
	bgSurfaceDangerHover: { default: redLight.s4, [DARK]: redDark.s4 },
	// The active state (on press) color for communicating critical information.
	bgSurfaceDangerActive: { default: redLight.s5, [DARK]: redDark.s5 },
	// Inverse and transparent surfaces
	// Use for elements on bg-inverse.
	bgSurfaceInverse: { default: grayDark.s5, [DARK]: grayDark.s5 },
	// Use for elements that need a fully transparent background.
	// The transparent value is represented by a zero-alpha primitive.
	bgSurfaceTransparent: {
		default: baseColors.transparent,
		[DARK]: baseColors.transparent,
	},

	// Fills
	// Neutral fills
	// The background color of contained elements with a smaller surface area, like a button.
	bgFill: { default: grayLight.s3, [DARK]: grayDark.s3 },
	// The hover state color of contained elements with a smaller surface area, like a button.
	bgFillHover: { default: grayLight.s4, [DARK]: grayDark.s4 },
	// The active state (on press) color of contained elements with a smaller surface area, like a button.
	bgFillActive: { default: grayLight.s5, [DARK]: grayDark.s5 },
	// The selected state color of contained elements with a smaller surface area, like a button or checkbox.
	bgFillSelected: { default: grayLight.s5, [DARK]: grayDark.s5 },
	// The disabled state color of contained elements with a smaller surface area, like a button.
	bgFillDisabled: { default: blackAlpha.s1, [DARK]: whiteAlpha.s1 },
	// The background color of elements with a smaller surface area and a secondary level of prominence.
	bgFillSecondary: { default: grayLight.s3, [DARK]: grayDark.s2 },
	// The hover state color of elements with a smaller surface area and a secondary level of prominence.
	bgFillSecondaryHover: {
		default: grayLight.s4,
		[DARK]: grayDark.s4,
	},
	// The active state (on press) color of elements with a smaller surface area and a secondary level of prominence.
	bgFillSecondaryActive: {
		default: grayLight.s5,
		[DARK]: grayDark.s5,
	},
	// The selected state (on press) color of elements with a smaller surface area and a secondary level of prominence.
	bgFillSecondarySelected: {
		default: grayLight.s5,
		[DARK]: grayDark.s5,
	},
	// The background color of elements with a smaller surface area and a third level of prominence.
	bgFillTertiary: { default: grayLight.s3, [DARK]: grayDark.s3 },
	// The hover state color of elements with a smaller surface area and a third level of prominence.
	bgFillTertiaryHover: { default: grayLight.s4, [DARK]: grayDark.s4 },
	// The active state (on press) color of elements with a smaller surface area and a third level of prominence.
	bgFillTertiaryActive: { default: grayLight.s5, [DARK]: grayDark.s5 },
	// The background color of main actions, like primary buttons.
	bgFillBrand: { default: irisLight.s9, [DARK]: irisDark.s9 },
	// The hover state color of main actions, like primary buttons.
	bgFillBrandHover: { default: irisLight.s10, [DARK]: irisDark.s10 },
	// The active state (on press) color of main actions, like primary buttons.
	bgFillBrandActive: { default: irisLight.s10, [DARK]: irisDark.s10 },
	// The selected state color of main actions, like primary buttons.
	bgFillBrandSelected: { default: irisLight.s9, [DARK]: irisDark.s9 },
	// The disabled state color of main actions, like primary buttons.
	bgFillBrandDisabled: {
		default: blackAlpha.s3,
		[DARK]: whiteAlpha.s4,
	},

	// Critical fills
	// Red step 9 is not dark enough for a readable white foreground.
	// Use the text-strength steps for the solid danger control.
	// Use for backgrounds communicating critical information on elements with a smaller surface area, like a badge or a banner.
	bgFillDanger: { default: redLight.s11, [DARK]: redDark.s8 },
	// The hover state color for communicating critical information on elements with a smaller surface area.
	bgFillDangerHover: { default: redLight.s12, [DARK]: redDark.s7 },
	// The active state (on press) color for communicating critical information on elements with a smaller surface area.
	bgFillDangerActive: { default: redLight.s12, [DARK]: redDark.s7 },
	// The selected state color for communicating critical information on elements with a smaller surface area.
	bgFillDangerSelected: {
		default: redLight.s12,
		[DARK]: redDark.s7,
	},
	// Use for backgrounds communicating critical information on elements with a smaller surface area, with a secondary level of prominence.
	bgFillDangerSecondary: { default: redLight.s3, [DARK]: redDark.s3 },
	// The hover state color for critical controls with a secondary level of prominence.
	bgFillDangerSecondaryHover: {
		default: redLight.s4,
		[DARK]: redDark.s4,
	},
	// The active state (on press) color for critical controls with a secondary level of prominence.
	bgFillDangerSecondaryActive: {
		default: redLight.s5,
		[DARK]: redDark.s5,
	},
	// Use for critical controls with a tertiary level of prominence, like outline buttons.
	bgFillDangerTertiary: { default: redLight.s2, [DARK]: redDark.s2 },
	// The hover state color for critical controls with a tertiary level of prominence.
	bgFillDangerTertiaryHover: {
		default: redLight.s3,
		[DARK]: redDark.s3,
	},
	// The active state (on press) color for critical controls with a tertiary level of prominence.
	bgFillDangerTertiaryActive: {
		default: redLight.s4,
		[DARK]: redDark.s4,
	},
	// Use for transparent critical controls, like danger ghost buttons.
	bgFillDangerTransparent: {
		default: redAlphaLight.s1,
		[DARK]: redAlphaDark.s1,
	},
	// The hover state color for transparent critical controls.
	bgFillDangerTransparentHover: {
		default: redAlphaLight.s2,
		[DARK]: redAlphaDark.s2,
	},
	// The active state (on press) color for transparent critical controls.
	bgFillDangerTransparentActive: {
		default: redAlphaLight.s3,
		[DARK]: redAlphaDark.s3,
	},
	// Inverse and transparent fills
	// The background color of elements with a smaller surface area on an inverse background.
	bgFillInverse: { default: grayDark.s5, [DARK]: grayDark.s5 },
	// The hover state color of elements with a smaller surface area on an inverse background.
	bgFillInverseHover: { default: grayDark.s7, [DARK]: grayDark.s7 },
	// The active state (on press) color of elements with a smaller surface area on an inverse background.
	bgFillInverseActive: { default: grayDark.s8, [DARK]: grayDark.s8 },
	// The background color of elements that need to sit on different background colors, like tabs.
	bgFillTransparent: { default: blackAlpha.s1, [DARK]: whiteAlpha.s1 },
	// The hover state color of elements that need to sit on different background colors, like tabs.
	bgFillTransparentHover: {
		default: blackAlpha.s2,
		[DARK]: whiteAlpha.s2,
	},
	// The active state (on press) color of elements that need to sit on different background colors, like tabs.
	bgFillTransparentActive: {
		default: blackAlpha.s3,
		[DARK]: whiteAlpha.s3,
	},
	// The selected state color of elements that need to sit on different background colors, like tabs.
	bgFillTransparentSelected: {
		default: blackAlpha.s3,
		[DARK]: whiteAlpha.s3,
	},

	// Text
	// Neutral text
	// The default text color.
	text: { default: baseColors.black, [DARK]: baseColors.white },
	// Use for text with a secondary level of prominence.
	textSecondary: { default: grayLight.s11, [DARK]: grayDark.s11 },

	// Use for text on interactive elements, like buttons and tabs.
	textInteractive: { default: grayLight.s11, [DARK]: grayDark.s11 },
	// The hover state color for text on interactive elements.
	textInteractiveHover: {
		default: baseColors.black,
		[DARK]: baseColors.white,
	},
	// The active state (on press) color for text on interactive elements.
	textInteractiveActive: {
		default: baseColors.black,
		[DARK]: baseColors.white,
	},

	// Use for text in a disabled state.
	textDisabled: { default: grayLight.s8, [DARK]: grayDark.s8 },

	// Use for neutral text links.
	textLink: { default: grayLight.s11, [DARK]: grayDark.s11 },
	// The hover state color for text links.
	textLinkHover: { default: baseColors.black, [DARK]: baseColors.white },
	// The active state (on press) color for text links.
	textLinkActive: { default: baseColors.black, [DARK]: baseColors.white },

	// Brand text
	// Use for text on bg-fill-brand, like primary buttons.
	textBrandOnBgFill: { default: baseColors.white, [DARK]: baseColors.white },
	// The hover state color for text on bg-fill-brand-hover.
	textBrandOnBgFillHover: {
		default: baseColors.white,
		[DARK]: baseColors.white,
	},
	// The active state (on press) color for text on bg-fill-brand.
	textBrandOnBgFillActive: {
		default: baseColors.white,
		[DARK]: baseColors.white,
	},
	// The disabled state color for text on bg-fill-brand-disabled.
	textBrandOnBgFillDisabled: {
		default: grayDark.s8,
		[DARK]: grayDark.s8,
	},

	// Semantic text
	// Use for text communicating important information.
	textInfo: { default: blueLight.s12, [DARK]: blueDark.s12 },

	// Use for text communicating success.
	textSuccess: { default: greenLight.s12, [DARK]: greenDark.s12 },

	// Use for text communicating warning.
	textWarning: { default: amberLight.s12, [DARK]: amberDark.s12 },

	// Use for text communicating critical information.
	textDanger: { default: redLight.s12, [DARK]: redDark.s12 },
	// The hover state color for text communicating critical information.
	textDangerHover: { default: redLight.s12, [DARK]: redDark.s12 },
	// The active state (on press) color for text communicating critical information.
	textDangerActive: { default: redLight.s12, [DARK]: redDark.s12 },
	// Use for text and icons on bg-fill-critical.
	textDangerOnBgFill: {
		default: baseColors.white,
		[DARK]: baseColors.white,
	},

	// Inverse text
	// Use for text on an inverse background.
	textInverse: { default: grayDark.s12, [DARK]: grayDark.s12 },
	// Use for secondary text on an inverse background.
	textInverseSecondary: {
		default: grayDark.s11,
		[DARK]: grayDark.s11,
	},
	// Use for text links on an inverse background.
	textLinkInverse: { default: grayDark.s11, [DARK]: grayDark.s11 },

	iconFlashcardActive: {
		default: amberLight.s9,
		[DARK]: amberDark.s9,
	},
	iconFlagActive: {
		default: orangeLight.s9,
		[DARK]: orangeDark.s9,
	},

	// Borders
	// Neutral borders
	// The default color for borders on any element.
	border: { default: grayLight.s7, [DARK]: grayDark.s7 },
	// The hover color for borders on any element.
	borderHover: { default: grayLight.s8, [DARK]: grayDark.s8 },
	// The disabled color for borders on any element.
	borderDisabled: { default: grayLight.s4, [DARK]: grayDark.s4 },
	// The color for hr elements or any visual dividers.
	borderSecondary: { default: grayLight.s6, [DARK]: grayDark.s6 },
	// The border color on any element. Pair with bg-surface-tertiary or bg-fill-tertiary.
	borderTertiary: { default: grayLight.s7, [DARK]: grayDark.s7 },
	// The focus ring for any interactive element in a focused state.
	borderFocus: { default: blueLight.s11, [DARK]: blueDark.s9 },

	// Semantic borders
	// Use for borders paired with brand colors.
	borderBrand: { default: irisLight.s7, [DARK]: irisDark.s7 },
	// Use for borders communicating information.
	borderInfo: { default: blueLight.s7, [DARK]: blueDark.s7 },
	// Use for borders communicating success.
	borderSuccess: { default: greenLight.s7, [DARK]: greenDark.s7 },
	// Use for borders communicating warning.
	borderWarning: { default: orangeLight.s7, [DARK]: orangeDark.s7 },
	// Use for borders communicating critical information.
	borderDanger: { default: redLight.s7, [DARK]: redDark.s7 },
	// The hover state color for borders communicating critical information.
	borderDangerHover: { default: redLight.s8, [DARK]: redDark.s8 },
	// The active state (on press) color for borders communicating critical information.
	borderDangerActive: { default: redLight.s8, [DARK]: redDark.s8 },
	// Use for borders communicating critical information, such as borders on invalid text fields.
	borderDangerSecondary: { default: redLight.s8, [DARK]: redDark.s8 },

	// Inverse borders
	// Use for borders on an inverse background, such as borders on the global search.
	borderInverse: { default: grayLight.s7, [DARK]: grayLight.s7 },
	// The hover state color for borders on an inverse background.
	borderInverseHover: {
		default: grayLight.s8,
		[DARK]: grayLight.s8,
	},
	// The active state (on press) color for borders on an inverse background.
	borderInverseActive: {
		default: grayLight.s8,
		[DARK]: grayLight.s8,
	},

	// Component-specific roles
	// Overlays and buttons
	// Use for the background of modal and overlay backdrops.
	backdropBg: { default: blackAlpha.s9, [DARK]: blackAlpha.s9 },
	// Use as the highlight gradient over filled buttons.
	buttonGradientBgFill: {
		default: `linear-gradient(180deg, ${grayAlphaDark.s1} 63.53%, ${whiteAlpha.s3} 100%)`,
		[DARK]: `linear-gradient(180deg, ${grayAlphaDark.s1} 63.53%, ${whiteAlpha.s3} 100%)`,
	},

	// Navigation
	// Use for the navigation container background.
	navBg: { default: grayLight.s1, [DARK]: grayDark.s1 },
	// Use for the default background of navigation items.
	navBgSurface: {
		default: grayAlphaLight.s2,
		[DARK]: grayAlphaDark.s2,
	},
	// Use for the background of navigation items on hover.
	navBgSurfaceHover: {
		default: grayLight.s4,
		[DARK]: grayDark.s4,
	},
	// Use for the background of active navigation items.
	navBgSurfaceActive: {
		default: grayLight.s5,
		[DARK]: grayDark.s5,
	},

	// Shadows and contrast
	// Use for subtle shadows.
	shadowSubtle: { default: blackAlpha.s2, [DARK]: blackAlpha.s5 },
	// Use for strong shadows.
	shadowStrong: { default: blackAlpha.s3, [DARK]: blackAlpha.s7 },
	// Use for inset contrast edges.
	insetContrast: { default: blackAlpha.s3, [DARK]: whiteAlpha.s3 },
})
