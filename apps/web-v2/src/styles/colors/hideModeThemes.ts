import * as stylex from '@stylexjs/stylex'

import {
	appShellColors,
	buttonColors,
	libraryCollectionItemColors,
	librarySidebarColors,
	sidebarItemColors,
	sidebarSectionHeaderColors,
	treeColors,
} from './components.stylex'
import { baseColors, blue, slate, whiteAlpha } from './primitives.stylex'
import { semanticColors } from './semantic.stylex'

export const hideModeAppShellTheme = stylex.createTheme(appShellColors, {
	chromeBackground: {
		default: 'oklch(49% 0.044 257.3)',
		'@media (prefers-color-scheme: dark)': slate.s900,
	},
})

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
	textSecondary: slate.s300,
	textTertiary: slate.s400,
	textDisabled: slate.s400,
	textOnInverse: slate.s900,
	textOnInverseSecondary: slate.s400,
	textInteractive: slate.s200,
	textInteractiveHover: whiteAlpha.s95,
	textInteractiveActive: whiteAlpha.s95,
	textInteractiveDisabled: slate.s400,

	borderPrimary: whiteAlpha.s20,
	borderSubtle: whiteAlpha.s10,
	borderStrong: whiteAlpha.s30,
	borderFocus: blue.s300,
})

export const hideModeSidebarItemTheme = stylex.createTheme(sidebarItemColors, {
	background: baseColors.transparent,
	backgroundHover: whiteAlpha.s10,
	backgroundSelected: whiteAlpha.s15,
	backgroundSelectedHover: whiteAlpha.s20,
	foreground: slate.s200,
	foregroundHover: whiteAlpha.s95,
	foregroundSelected: whiteAlpha.s95,
})

export const hideModeSidebarSectionHeaderTheme = stylex.createTheme(
	sidebarSectionHeaderColors,
	{
		foreground: semanticColors.textTertiary,
	},
)

export const hideModeSidebarButtonTheme = stylex.createTheme(buttonColors, {
	focusRingRest: baseColors.transparent,
	focusRing: blue.s300,

	secondaryBorder: baseColors.transparent,
	secondaryBackground: whiteAlpha.s10,
	secondaryBackgroundHover: whiteAlpha.s15,
	secondaryBackgroundPressed: whiteAlpha.s20,
	secondaryForeground: slate.s200,
	secondaryForegroundHover: whiteAlpha.s95,
	secondaryForegroundPressed: whiteAlpha.s95,

	ghostBorder: baseColors.transparent,
	ghostBackground: baseColors.transparent,
	ghostBackgroundHover: whiteAlpha.s10,
	ghostBackgroundPressed: whiteAlpha.s15,
	ghostForeground: slate.s300,
	ghostForegroundHover: whiteAlpha.s95,
	ghostForegroundPressed: whiteAlpha.s95,
	ghostDisabledBorder: baseColors.transparent,
	ghostDisabledBackground: baseColors.transparent,
	ghostDisabledForeground: slate.s500,
})

export const hideModeTreeTheme = stylex.createTheme(treeColors, {
	itemBackgroundHover: whiteAlpha.s10,
	itemBackgroundSelected: whiteAlpha.s15,
	itemBackgroundSelectedHover: whiteAlpha.s20,
	labelBackground: baseColors.transparent,
	labelForeground: slate.s300,
	labelForegroundHover: whiteAlpha.s95,
	labelForegroundSelected: whiteAlpha.s95,
	labelFocusRingRest: baseColors.transparent,
	labelFocusRing: blue.s300,
})

export const hideModeLibrarySidebarTheme = stylex.createTheme(
	librarySidebarColors,
	{
		containerBackgroundDropTarget: whiteAlpha.s10,
	},
)

export const hideModeLibraryCollectionItemTheme = stylex.createTheme(
	libraryCollectionItemColors,
	{
		containerBackgroundDragging: whiteAlpha.s5,
		containerBackgroundDropTarget: whiteAlpha.s10,
	},
)
