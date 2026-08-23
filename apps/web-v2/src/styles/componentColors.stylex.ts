import * as stylex from '@stylexjs/stylex'

import {
	amberDark,
	amberLight,
	blueDark,
	blueLight,
	orangeDark,
	orangeLight,
} from './colorPrimitives.stylex'
import { colorsV2 } from './colorsV2.stylex'

export const breadcrumbColors = stylex.defineVars({
	linkForeground: colorsV2.textInteractive,
	linkForegroundHover: colorsV2.textInteractiveHover,
	linkForegroundPressed: colorsV2.textInteractiveActive,
	linkFocusRingRest: colorsV2.surfaceTransparent,
	linkFocusRing: colorsV2.borderFocus,

	listForeground: colorsV2.textSecondary,
	pageForeground: colorsV2.textPrimary,
})

export const buttonColors = stylex.defineVars({
	focusRingRest: colorsV2.surfaceTransparent,
	focusRing: colorsV2.borderFocus,

	primaryBorder: colorsV2.surfaceTransparent,
	primaryBackground: colorsV2.surfaceInteractivePrimary,
	primaryBackgroundHover: colorsV2.surfaceInteractivePrimaryHover,
	primaryBackgroundPressed: colorsV2.surfaceInteractivePrimaryActive,
	primaryForeground: colorsV2.textOnBrand,
	primaryForegroundHover: colorsV2.textOnBrand,
	primaryForegroundPressed: colorsV2.textOnBrand,

	secondaryBorder: colorsV2.surfaceTransparent,
	secondaryBackground: colorsV2.surfaceInteractiveSecondary,
	secondaryBackgroundHover: colorsV2.surfaceInteractiveSecondaryHover,
	secondaryBackgroundPressed: colorsV2.surfaceInteractiveSecondaryActive,
	secondaryForeground: colorsV2.textInteractive,
	secondaryForegroundHover: colorsV2.textInteractiveHover,
	secondaryForegroundPressed: colorsV2.textInteractiveActive,

	outlineBorder: colorsV2.borderSubtle,
	outlineBackground: colorsV2.surfaceInteractiveSecondary,
	outlineBackgroundHover: colorsV2.surfaceInteractiveSecondaryHover,
	outlineBackgroundPressed: colorsV2.surfaceInteractiveSecondaryActive,
	outlineForeground: colorsV2.textInteractive,
	outlineForegroundHover: colorsV2.textInteractiveHover,
	outlineForegroundPressed: colorsV2.textInteractiveActive,

	ghostBorder: colorsV2.surfaceTransparent,
	ghostBackground: colorsV2.surfaceTransparent,
	ghostBackgroundHover: colorsV2.surfaceTransparentHover,
	ghostBackgroundPressed: colorsV2.surfaceTransparentActive,
	ghostForeground: colorsV2.textInteractive,
	ghostForegroundHover: colorsV2.textInteractiveHover,
	ghostForegroundPressed: colorsV2.textInteractiveActive,

	dangerBorder: colorsV2.surfaceTransparent,
	dangerBackground: colorsV2.surfaceInteractiveDanger,
	dangerBackgroundHover: colorsV2.surfaceInteractiveDangerHover,
	dangerBackgroundPressed: colorsV2.surfaceInteractiveDangerActive,
	dangerForeground: colorsV2.textDanger,
	dangerForegroundHover: colorsV2.textDangerHover,
	dangerForegroundPressed: colorsV2.textDangerActive,

	primaryDisabledBorder: colorsV2.surfaceTransparent,
	primaryDisabledBackground: colorsV2.surfaceInteractivePrimaryDisabled,
	primaryDisabledForeground: colorsV2.textOnBrandDisabled,

	disabledBorder: colorsV2.borderDisabled,
	disabledBackground: colorsV2.surfaceInteractiveSecondaryDisabled,
	disabledForeground: colorsV2.textDisabled,
})

export const calendarColors = stylex.defineVars({
	navButtonBorder: colorsV2.surfaceTransparent,
	navButtonBackground: colorsV2.surfaceTransparent,
	navButtonBackgroundHover: colorsV2.surfaceTransparentHover,
	navButtonBackgroundPressed: colorsV2.surfaceTransparentActive,
	navButtonForeground: colorsV2.textInteractive,
	navButtonFocusRingRest: colorsV2.surfaceTransparent,
	navButtonFocusRing: colorsV2.borderFocus,

	weekdayForeground: colorsV2.textSecondary,

	dayButtonBorder: colorsV2.surfaceTransparent,
	dayButtonBackground: colorsV2.surfaceTransparent,
	dayButtonBackgroundHover: colorsV2.surfaceTransparentHover,
	dayButtonBackgroundSelected: colorsV2.surfaceInteractivePrimary,
	dayButtonBackgroundSelectedHover: colorsV2.surfaceInteractivePrimaryHover,
	dayButtonBackgroundToday: {
		default: blueLight.s3,
		'@media (prefers-color-scheme: dark)': blueDark.s3,
	},
	dayButtonBackgroundTodayHover: {
		default: blueLight.s4,
		'@media (prefers-color-scheme: dark)': blueDark.s4,
	},
	dayButtonForeground: colorsV2.textPrimary,
	dayButtonForegroundSelected: colorsV2.textOnBrand,
	dayButtonFocusRingRest: colorsV2.surfaceTransparent,
	dayButtonFocusRing: colorsV2.borderFocus,
})

export const dialogColors = stylex.defineVars({
	overlayBackground: colorsV2.surfaceBackdrop,

	popupBorder: colorsV2.borderPrimary,
	popupBackground: colorsV2.surfaceRaised,
	popupForeground: colorsV2.textPrimary,
	popupShadow: colorsV2.shadowStrong,

	fullscreenBackground: colorsV2.surfacePrimary,

	closeButtonBorder: colorsV2.surfaceTransparent,
	closeButtonBackground: colorsV2.surfaceTransparent,
	closeButtonBackgroundHover: colorsV2.surfaceTransparentHover,
	closeButtonBackgroundPressed: colorsV2.surfaceTransparentActive,
	closeButtonFocusRingRest: colorsV2.surfaceTransparent,
	closeButtonFocusRing: colorsV2.borderFocus,

	descriptionForeground: colorsV2.textSecondary,
})

export const dropdownMenuColors = stylex.defineVars({
	popupBorder: colorsV2.borderPrimary,
	popupBackground: colorsV2.surfaceRaised,
	popupForeground: colorsV2.textPrimary,
	popupShadow: colorsV2.shadowSubtle,

	itemBackground: colorsV2.surfaceTransparent,
	itemBackgroundHighlighted: colorsV2.surfaceTransparentHover,
	itemForeground: colorsV2.textInteractive,
	itemForegroundHighlighted: colorsV2.textInteractiveHover,
	itemForegroundPressed: colorsV2.textInteractiveActive,

	subTriggerBackground: colorsV2.surfaceTransparent,
	subTriggerBackgroundHighlighted: colorsV2.surfaceTransparentHover,
	subTriggerForeground: colorsV2.textInteractive,
	subTriggerForegroundHighlighted: colorsV2.textInteractiveHover,
	subTriggerForegroundPressed: colorsV2.textInteractiveActive,

	shortcutForeground: colorsV2.textSecondary,
	separatorBackground: colorsV2.borderSubtle,
})

export const popoverColors = stylex.defineVars({
	popupBorder: colorsV2.borderPrimary,
	popupBackground: colorsV2.surfaceRaised,
	popupForeground: colorsV2.textPrimary,
	popupShadow: colorsV2.shadowSubtle,
})

export const separatorColors = stylex.defineVars({
	background: colorsV2.borderSubtle,
})

export const toasterColors = stylex.defineVars({
	normalBackground: colorsV2.surfaceRaised,
	normalBorder: colorsV2.borderPrimary,
	normalForeground: colorsV2.textPrimary,

	errorBackground: colorsV2.surfaceInteractiveDanger,
	errorBorder: colorsV2.borderDanger,
	errorForeground: colorsV2.textDanger,
})

export const tabsColors = stylex.defineVars({
	listBackground: colorsV2.surfaceSecondary,
	listForeground: colorsV2.textSecondary,
	lineListBorder: colorsV2.borderSubtle,
	lineListBorderRest: colorsV2.surfaceTransparent,

	triggerBorder: colorsV2.surfaceTransparent,
	triggerBackground: colorsV2.surfaceTransparent,
	triggerForeground: colorsV2.textInteractive,
	triggerForegroundHover: colorsV2.textInteractiveHover,
	triggerForegroundPressed: colorsV2.textInteractiveActive,
	triggerForegroundSelected: colorsV2.textInteractiveActive,
	triggerForegroundDisabled: colorsV2.textDisabled,
	triggerFocusRingRest: colorsV2.surfaceTransparent,
	triggerFocusRing: colorsV2.borderFocus,

	defaultTriggerBackground: colorsV2.surfaceTransparent,
	defaultTriggerBackgroundSelected: colorsV2.surfaceTransparentHover,
	defaultTriggerShadowSelected: colorsV2.shadowSubtle,

	lineTriggerBorderRest: colorsV2.surfaceTransparent,
	lineTriggerBorderSelected: colorsV2.borderBrand,

	contentFocusRingRest: colorsV2.surfaceTransparent,
	contentFocusRing: colorsV2.borderFocus,
})

export const textareaColors = stylex.defineVars({
	border: colorsV2.surfaceTransparent,
	background: colorsV2.surfaceTransparent,
	foreground: colorsV2.textPrimary,
	foregroundDisabled: colorsV2.textDisabled,
	focusRingRest: colorsV2.surfaceTransparent,
	placeholderForeground: colorsV2.textSecondary,
})

export const tooltipColors = stylex.defineVars({
	popupBackground: colorsV2.surfaceInverse,
	popupForeground: colorsV2.textOnInverse,
	popupShadow: colorsV2.shadowSubtle,
})

export const treeColors = stylex.defineVars({
	itemBackgroundHover: colorsV2.surfaceTransparentHover,
	itemBackgroundSelected: colorsV2.surfaceTransparentActive,
	itemBackgroundSelectedHover: colorsV2.surfaceTransparentActive,

	labelBackground: colorsV2.surfaceTransparent,
	labelForeground: colorsV2.textInteractive,
	labelForegroundHover: colorsV2.textInteractiveHover,
	labelForegroundSelected: colorsV2.textInteractiveActive,
	labelFocusRingRest: colorsV2.surfaceTransparent,
	labelFocusRing: colorsV2.borderFocus,
})

export const appSidebarColors = stylex.defineVars({
	background: colorsV2.surfaceTransparent,
	border: colorsV2.borderSubtle,
})

export const loadingIndicatorColors = stylex.defineVars({
	foreground: colorsV2.textSecondary,
})

export const sidebarItemColors = stylex.defineVars({
	background: colorsV2.surfaceTransparent,
	backgroundHover: colorsV2.surfaceTransparentHover,
	backgroundSelected: colorsV2.surfaceTransparentActive,
	backgroundSelectedHover: colorsV2.surfaceTransparentActive,

	foreground: colorsV2.textInteractive,
	foregroundHover: colorsV2.textInteractiveHover,
	foregroundSelected: colorsV2.textInteractiveActive,
})

export const notAuthenticatedPageColors = stylex.defineVars({
	loadingIndicatorForeground: colorsV2.textSecondary,
})

export const librarySidebarColors = stylex.defineVars({
	headerBackgroundDropTarget: colorsV2.surfaceTransparentActive,
})

export const libraryTopicItemColors = stylex.defineVars({
	containerBackgroundDragging: colorsV2.surfaceSecondary,
	containerBackgroundDropTarget: colorsV2.surfaceTransparentHover,
})

export const moveTopicDialogColors = stylex.defineVars({
	treeBorder: colorsV2.borderPrimary,
	statusForeground: colorsV2.textSecondary,
})

export const focusOverlayColors = stylex.defineVars({
	containerBackground: colorsV2.surfaceRaised,
	cardBackground: colorsV2.surfacePrimary,

	positionForeground: colorsV2.textSecondary,
	emptyForeground: colorsV2.textSecondary,
})

export const focusOverlayCardErrorColors = stylex.defineVars({
	messageForeground: colorsV2.textSecondary,
})

export const hideModeButtonColors = stylex.defineVars({
	selectedBackground: {
		default: blueLight.s3,
		'@media (prefers-color-scheme: dark)': blueDark.s3,
	},
	selectedBackgroundHover: {
		default: blueLight.s4,
		'@media (prefers-color-scheme: dark)': blueDark.s4,
	},
	selectedForeground: {
		default: blueLight.s12,
		'@media (prefers-color-scheme: dark)': blueDark.s12,
	},
})

export const hideableColors = stylex.defineVars({
	placeholderBackground: colorsV2.surfaceInteractiveSecondary,
})

export const reviewColors = stylex.defineVars({
	rowBackground: colorsV2.surfaceTransparent,

	ratingBadgeBackground: colorsV2.surfaceInteractivePrimary,
	ratingBadgeForeground: colorsV2.textOnBrand,

	notesButtonBackground: colorsV2.surfaceTransparent,
	notesButtonForeground: colorsV2.textPrimary,

	notesIndicatorForeground: colorsV2.textSecondary,
})

export const reviewCardActionsColors = stylex.defineVars({
	flashcardSelectedForeground: {
		default: amberLight.s9,
		'@media (prefers-color-scheme: dark)': amberDark.s9,
	},
	flagSelectedForeground: {
		default: orangeLight.s9,
		'@media (prefers-color-scheme: dark)': orangeDark.s9,
	},
})

export const reviewCardItemColors = stylex.defineVars({
	containerBackgroundHover: colorsV2.surfaceTransparentHover,
	containerForeground: colorsV2.textPrimary,

	titleForeground: colorsV2.textPrimary,
})

export const reviewCardMetadataColors = stylex.defineVars({
	itemForeground: colorsV2.textSecondary,
})

export const reviewDatePickerColors = stylex.defineVars({
	triggerForegroundToday: {
		default: blueLight.s12,
		'@media (prefers-color-scheme: dark)': blueDark.s12,
	},
	triggerForegroundOverdue: colorsV2.textDanger,
})

export const reviewsSidebarColors = stylex.defineVars({
	containerBackground: colorsV2.surfaceSecondary,

	seeAllForeground: colorsV2.textInteractive,
	seeAllForegroundHover: colorsV2.textInteractiveHover,
	seeAllForegroundPressed: colorsV2.textInteractiveActive,
})

export const searchDialogColors = stylex.defineVars({
	popupBorder: colorsV2.borderSubtle,
	popupBackground: colorsV2.surfacePrimary,

	headerBorder: colorsV2.borderSubtle,
	searchIconForeground: colorsV2.textSecondary,

	inputBackground: colorsV2.surfaceTransparent,
	inputForeground: colorsV2.textPrimary,
	inputPlaceholderForeground: colorsV2.textSecondary,

	statusForeground: colorsV2.textSecondary,
})

export const searchResultGroupColors = stylex.defineVars({
	titleForeground: colorsV2.textSecondary,
	controlForeground: colorsV2.textSecondary,
	emptyForeground: colorsV2.textSecondary,
})

export const searchResultItemColors = stylex.defineVars({
	background: colorsV2.surfaceTransparent,
	backgroundHover: colorsV2.surfaceTransparentHover,
	backgroundFocusVisible: colorsV2.surfaceTransparentActive,
	foreground: colorsV2.textPrimary,
	focusRingRest: colorsV2.surfaceTransparent,
	focusRing: colorsV2.borderFocus,

	secondaryForeground: colorsV2.textSecondary,
	pathForeground: colorsV2.textSecondary,
})

export const basicRoutePageColors = stylex.defineVars({
	descriptionForeground: colorsV2.textSecondary,
})
