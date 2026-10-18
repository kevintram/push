import * as stylex from '@stylexjs/stylex'

import {
	buttonColors,
	libraryCollectionItemColors,
	librarySidebarColors,
	sidebarItemColors,
	sidebarSectionHeaderColors,
	treeColors,
} from '~/styles/colors/components.stylex'
import { blue, slate, whiteAlpha } from '~/styles/colors/primitives.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

// The hide-mode palette for the blue-gray chrome. Text steps mirror the base
// semantic scale (interactive matches secondary; disabled matches tertiary)
// so hierarchy and disabled states read the same as outside hide mode.
const hideModeOnSemanticTheme = stylex.createTheme(semanticColors, {
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

// Component aliases are computed where they are declared (the root), so they
// must be redeclared on the themed node to resolve against the hide-mode
// semantic palette above. These mirror the base aliases in
// components.stylex.ts; tune colors in the semantic theme, not here.
const hideModeOnItemTheme = stylex.createTheme(sidebarItemColors, {
	focusRingRest: semanticColors.surfaceTransparent,
	focusRing: semanticColors.borderFocus,
	background: semanticColors.surfaceTransparent,
	backgroundHover: semanticColors.surfaceTransparentHover,
	backgroundPressed: semanticColors.surfaceTransparentActive,
	backgroundSelected: semanticColors.surfaceTransparentActive,
	backgroundSelectedHover: semanticColors.surfaceTransparentActive,
	foreground: semanticColors.textInteractive,
	foregroundHover: semanticColors.textInteractiveHover,
	foregroundPressed: semanticColors.textInteractiveActive,
	foregroundSelected: semanticColors.textInteractiveActive,
	foregroundDisabled: semanticColors.textInteractiveDisabled,
})

const hideModeOnSectionHeaderTheme = stylex.createTheme(
	sidebarSectionHeaderColors,
	{
		foreground: semanticColors.textInteractive,
		foregroundHover: semanticColors.textInteractiveHover,
		foregroundPressed: semanticColors.textInteractiveActive,
		foregroundDisabled: semanticColors.textInteractiveDisabled,
	},
)

const hideModeOnButtonTheme = stylex.createTheme(buttonColors, {
	focusRingRest: semanticColors.surfaceTransparent,
	focusRing: semanticColors.borderFocus,

	secondaryBorder: semanticColors.surfaceTransparent,
	secondaryBackground: semanticColors.surfaceInteractiveSecondary,
	secondaryBackgroundHover: semanticColors.surfaceInteractiveSecondaryHover,
	secondaryBackgroundPressed:
		semanticColors.surfaceInteractiveSecondaryActive,
	secondaryForeground: semanticColors.textInteractive,
	secondaryForegroundHover: semanticColors.textInteractiveHover,
	secondaryForegroundPressed: semanticColors.textInteractiveActive,

	ghostBorder: semanticColors.surfaceTransparent,
	ghostBackground: semanticColors.surfaceTransparent,
	ghostBackgroundHover: semanticColors.surfaceTransparentHover,
	ghostBackgroundPressed: semanticColors.surfaceTransparentActive,
	ghostForeground: semanticColors.textInteractive,
	ghostForegroundHover: semanticColors.textInteractiveHover,
	ghostForegroundPressed: semanticColors.textInteractiveActive,
	ghostDisabledBorder: semanticColors.surfaceTransparent,
	ghostDisabledBackground: semanticColors.surfaceTransparent,
	ghostDisabledForeground: semanticColors.textInteractiveDisabled,
})

const hideModeOnTreeTheme = stylex.createTheme(treeColors, {
	itemBackgroundHover: semanticColors.surfaceTransparentHover,
	itemBackgroundSelected: semanticColors.surfaceTransparentActive,
	itemBackgroundSelectedHover: semanticColors.surfaceTransparentActive,
	labelBackground: semanticColors.surfaceTransparent,
	labelForeground: semanticColors.textInteractive,
	labelForegroundHover: semanticColors.textInteractiveHover,
	labelForegroundSelected: semanticColors.textInteractiveActive,
	labelFocusRingRest: semanticColors.surfaceTransparent,
	labelFocusRing: semanticColors.borderFocus,
})

const hideModeOnLibraryTheme = stylex.createTheme(librarySidebarColors, {
	containerBackgroundDropTarget: semanticColors.surfaceTransparentHover,
})

const hideModeOnCollectionItemTheme = stylex.createTheme(
	libraryCollectionItemColors,
	{
		containerBackgroundDragging: semanticColors.surfaceSecondary,
		containerBackgroundDropTarget: semanticColors.surfaceTransparentHover,
	},
)

export const hideModeSidebarTheme = [
	hideModeOnSemanticTheme,
	hideModeOnItemTheme,
	hideModeOnSectionHeaderTheme,
	hideModeOnButtonTheme,
	hideModeOnTreeTheme,
	hideModeOnLibraryTheme,
	hideModeOnCollectionItemTheme,
]
