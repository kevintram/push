import * as stylex from '@stylexjs/stylex'

import { amber, blue, orange, violet } from './primitives.stylex'
import { semanticColors } from './semantic.stylex'

export const breadcrumbColors = stylex.defineVars({
	linkForeground: semanticColors.textInteractive,
	linkForegroundHover: semanticColors.textInteractiveHover,
	linkForegroundPressed: semanticColors.textInteractiveActive,
	linkFocusRingRest: semanticColors.surfaceTransparent,
	linkFocusRing: semanticColors.borderFocus,

	listForeground: semanticColors.textSecondary,
	pageForeground: semanticColors.textPrimary,
})

export const buttonColors = stylex.defineVars({
	focusRingRest: semanticColors.surfaceTransparent,
	focusRing: semanticColors.borderFocus,

	primaryBorder: semanticColors.surfaceTransparent,
	primaryBackground: semanticColors.surfaceInteractivePrimary,
	primaryBackgroundHover: semanticColors.surfaceInteractivePrimaryHover,
	primaryBackgroundPressed: semanticColors.surfaceInteractivePrimaryActive,
	primaryForeground: semanticColors.textOnBrand,
	primaryForegroundHover: semanticColors.textOnBrand,
	primaryForegroundPressed: semanticColors.textOnBrand,

	secondaryBorder: semanticColors.surfaceTransparent,
	secondaryBackground: semanticColors.surfaceInteractiveSecondary,
	secondaryBackgroundHover: semanticColors.surfaceInteractiveSecondaryHover,
	secondaryBackgroundPressed:
		semanticColors.surfaceInteractiveSecondaryActive,
	secondaryForeground: semanticColors.textInteractive,
	secondaryForegroundHover: semanticColors.textInteractiveHover,
	secondaryForegroundPressed: semanticColors.textInteractiveActive,

	outlineBorder: semanticColors.borderSubtle,
	outlineBackground: semanticColors.surfaceInteractiveSecondary,
	outlineBackgroundHover: semanticColors.surfaceInteractiveSecondaryHover,
	outlineBackgroundPressed: semanticColors.surfaceInteractiveSecondaryActive,
	outlineForeground: semanticColors.textInteractive,
	outlineForegroundHover: semanticColors.textInteractiveHover,
	outlineForegroundPressed: semanticColors.textInteractiveActive,

	ghostBorder: semanticColors.surfaceTransparent,
	ghostBackground: semanticColors.surfaceTransparent,
	ghostBackgroundHover: semanticColors.surfaceTransparentHover,
	ghostBackgroundPressed: semanticColors.surfaceTransparentActive,
	ghostForeground: semanticColors.textInteractive,
	ghostForegroundHover: semanticColors.textInteractiveHover,
	ghostForegroundPressed: semanticColors.textInteractiveActive,

	dangerBorder: semanticColors.surfaceTransparent,
	dangerBackground: semanticColors.surfaceInteractiveDanger,
	dangerBackgroundHover: semanticColors.surfaceInteractiveDangerHover,
	dangerBackgroundPressed: semanticColors.surfaceInteractiveDangerActive,
	dangerForeground: semanticColors.textOnDanger,
	dangerForegroundHover: semanticColors.textOnDanger,
	dangerForegroundPressed: semanticColors.textOnDanger,

	primaryDisabledBorder: semanticColors.surfaceTransparent,
	primaryDisabledBackground: semanticColors.surfaceInteractivePrimaryDisabled,
	primaryDisabledForeground: semanticColors.textOnBrandDisabled,

	disabledBorder: semanticColors.borderDisabled,
	disabledBackground: semanticColors.surfaceInteractiveSecondaryDisabled,
	disabledForeground: semanticColors.textDisabled,
})

export const calendarColors = stylex.defineVars({
	navButtonBorder: semanticColors.surfaceTransparent,
	navButtonBackground: semanticColors.surfaceTransparent,
	navButtonBackgroundHover: semanticColors.surfaceTransparentHover,
	navButtonBackgroundPressed: semanticColors.surfaceTransparentActive,
	navButtonForeground: semanticColors.textInteractive,
	navButtonFocusRingRest: semanticColors.surfaceTransparent,
	navButtonFocusRing: semanticColors.borderFocus,

	weekdayForeground: semanticColors.textSecondary,

	dayButtonBorder: semanticColors.surfaceTransparent,
	dayButtonBackground: semanticColors.surfaceTransparent,
	dayButtonBackgroundHover: semanticColors.surfaceTransparentHover,
	dayButtonBackgroundSelected: semanticColors.surfaceInteractivePrimary,
	dayButtonBackgroundSelectedHover:
		semanticColors.surfaceInteractivePrimaryHover,
	dayButtonBackgroundToday: {
		default: blue.s400,
		'@media (prefers-color-scheme: dark)': blue.s900,
	},
	dayButtonBackgroundTodayHover: {
		default: blue.s600,
		'@media (prefers-color-scheme: dark)': blue.s600,
	},
	dayButtonForeground: semanticColors.textPrimary,
	dayButtonForegroundSelected: semanticColors.textOnBrand,
	dayButtonForegroundToday: semanticColors.textOnBrand,
	dayButtonFocusRingRest: semanticColors.surfaceTransparent,
	dayButtonFocusRing: semanticColors.borderFocus,
})

export const dialogColors = stylex.defineVars({
	overlayBackground: semanticColors.surfaceBackdrop,

	popupBorder: semanticColors.borderPrimary,
	popupBackground: semanticColors.surfaceRaised,
	popupForeground: semanticColors.textPrimary,
	popupShadow: semanticColors.shadowStrong,

	fullscreenBackground: semanticColors.surfacePrimary,

	closeButtonBorder: semanticColors.surfaceTransparent,
	closeButtonBackground: semanticColors.surfaceTransparent,
	closeButtonBackgroundHover: semanticColors.surfaceTransparentHover,
	closeButtonBackgroundPressed: semanticColors.surfaceTransparentActive,
	closeButtonFocusRingRest: semanticColors.surfaceTransparent,
	closeButtonFocusRing: semanticColors.borderFocus,

	descriptionForeground: semanticColors.textSecondary,
})

export const dropdownMenuColors = stylex.defineVars({
	popupBorder: semanticColors.borderPrimary,
	popupBackground: semanticColors.surfaceRaised,
	popupForeground: semanticColors.textPrimary,
	popupShadow: semanticColors.shadowSubtle,

	itemBackground: semanticColors.surfaceTransparent,
	itemBackgroundHighlighted: semanticColors.surfaceTransparentHover,
	itemForeground: semanticColors.textInteractive,
	itemForegroundHighlighted: semanticColors.textInteractiveHover,
	itemForegroundPressed: semanticColors.textInteractiveActive,

	subTriggerBackground: semanticColors.surfaceTransparent,
	subTriggerBackgroundHighlighted: semanticColors.surfaceTransparentHover,
	subTriggerForeground: semanticColors.textInteractive,
	subTriggerForegroundHighlighted: semanticColors.textInteractiveHover,
	subTriggerForegroundPressed: semanticColors.textInteractiveActive,

	shortcutForeground: semanticColors.textSecondary,
	separatorBackground: semanticColors.borderSubtle,
})

export const popoverColors = stylex.defineVars({
	popupBorder: semanticColors.borderPrimary,
	popupBackground: semanticColors.surfaceRaised,
	popupForeground: semanticColors.textPrimary,
	popupShadow: semanticColors.shadowSubtle,
})

export const separatorColors = stylex.defineVars({
	background: semanticColors.borderSubtle,
})

export const toasterColors = stylex.defineVars({
	normalBackground: semanticColors.surfaceRaised,
	normalBorder: semanticColors.borderPrimary,
	normalForeground: semanticColors.textPrimary,

	errorBackground: semanticColors.surfaceDanger,
	errorBorder: semanticColors.borderDanger,
	errorForeground: semanticColors.textDanger,
})

export const tabsColors = stylex.defineVars({
	listBackground: semanticColors.surfaceSecondary,
	listForeground: semanticColors.textSecondary,
	lineListBorder: semanticColors.borderSubtle,
	lineListBorderRest: semanticColors.surfaceTransparent,

	triggerBorder: semanticColors.surfaceTransparent,
	triggerBackground: semanticColors.surfaceTransparent,
	triggerForeground: semanticColors.textInteractive,
	triggerForegroundHover: semanticColors.textInteractiveHover,
	triggerForegroundPressed: semanticColors.textInteractiveActive,
	triggerForegroundSelected: semanticColors.textInteractiveActive,
	triggerForegroundDisabled: semanticColors.textDisabled,
	triggerFocusRingRest: semanticColors.surfaceTransparent,
	triggerFocusRing: semanticColors.borderFocus,

	defaultTriggerBackground: semanticColors.surfaceTransparent,
	defaultTriggerBackgroundSelected: semanticColors.surfaceTransparentHover,
	defaultTriggerShadowSelected: semanticColors.shadowSubtle,

	lineTriggerBorderRest: semanticColors.surfaceTransparent,
	lineTriggerBorderSelected: semanticColors.borderBrand,

	contentFocusRingRest: semanticColors.surfaceTransparent,
	contentFocusRing: semanticColors.borderFocus,
})

export const textareaColors = stylex.defineVars({
	border: semanticColors.surfaceTransparent,
	background: semanticColors.surfaceTransparent,
	foreground: semanticColors.textPrimary,
	foregroundDisabled: semanticColors.textDisabled,
	focusRingRest: semanticColors.surfaceTransparent,
	placeholderForeground: semanticColors.textSecondary,
})

export const kbdColors = stylex.defineVars({
	background: semanticColors.surfaceRaised,
	foreground: semanticColors.textSecondary,
})

export const tooltipColors = stylex.defineVars({
	popupBorder: semanticColors.borderSubtle,
	popupBackground: semanticColors.surfaceRaised,
	popupForeground: semanticColors.textPrimary,
	popupShadow: semanticColors.shadowSubtle,
})

export const treeColors = stylex.defineVars({
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

export const appRailColors = stylex.defineVars({
	background: semanticColors.surfaceSunken,
})

export const appShellColors = stylex.defineVars({
	surfaceBackground: semanticColors.surfacePrimary,
	surfaceShadow: semanticColors.shadowSubtle,
})

export const loadingIndicatorColors = stylex.defineVars({
	foreground: semanticColors.textSecondary,
})

export const appRailItemColors = stylex.defineVars({
	background: semanticColors.surfaceTransparent,
	backgroundHover: semanticColors.surfaceTransparentHover,
	backgroundSelected: semanticColors.surfaceTransparentActive,
	backgroundSelectedHover: semanticColors.surfaceTransparentActive,

	foreground: semanticColors.textInteractive,
	foregroundHover: semanticColors.textInteractiveHover,
	foregroundSelected: semanticColors.textInteractiveActive,
})

export const notAuthenticatedPageColors = stylex.defineVars({
	loadingIndicatorForeground: semanticColors.textSecondary,
})

export const librarySidebarColors = stylex.defineVars({
	background: semanticColors.surfaceSecondary,
	headerBackgroundDropTarget: semanticColors.surfaceTransparentActive,
})

export const libraryCollectionItemColors = stylex.defineVars({
	containerBackgroundDragging: semanticColors.surfaceSecondary,
	containerBackgroundDropTarget: semanticColors.surfaceTransparentHover,
})

export const subcollectionsPanelColors = stylex.defineVars({
	containerBackground: semanticColors.surfaceSecondary,

	titleForeground: semanticColors.textSecondary,

	itemForeground: semanticColors.textPrimary,
	itemBackgroundHover: semanticColors.surfaceTransparentHover,
	itemBackgroundActive: semanticColors.surfaceTransparentActive,
})

export const moveCollectionDialogColors = stylex.defineVars({
	treeBorder: semanticColors.borderPrimary,
	statusForeground: semanticColors.textSecondary,
})

export const reviewQueueColors = stylex.defineVars({
	containerBackground: semanticColors.surfaceRaised,
	contentBackground: semanticColors.surfacePrimary,
	sidebarBackground: semanticColors.surfacePrimary,

	positionForeground: semanticColors.textSecondary,
	emptyForeground: semanticColors.textSecondary,
})

export const cardDetailErrorColors = stylex.defineVars({
	messageForeground: semanticColors.textSecondary,
})

export const flaggedCardFocusColors = stylex.defineVars({
	containerBackground: semanticColors.surfaceRaised,
	cardBackground: semanticColors.surfacePrimary,

	positionForeground: semanticColors.textSecondary,
	emptyForeground: semanticColors.textSecondary,
})

export const hideModeButtonColors = stylex.defineVars({
	backgroundActive: {
		default: blue.s200,
		'@media (prefers-color-scheme: dark)': blue.s950,
	},
	backgroundActiveHover: {
		default: blue.s300,
		'@media (prefers-color-scheme: dark)': blue.s900,
	},
	foregroundActive: {
		default: blue.s900,
		'@media (prefers-color-scheme: dark)': blue.s200,
	},
})

export const hideableColors = stylex.defineVars({
	placeholderBackground: semanticColors.surfaceInteractiveSecondary,
})

export const reviewColors = stylex.defineVars({
	rowBackground: semanticColors.surfaceTransparent,
	rowBackgroundHover: semanticColors.surfaceTransparentHover,

	ratingBadgeBackground: semanticColors.surfaceInteractivePrimary,
	ratingBadgeForeground: semanticColors.textOnBrand,

	notesButtonBackground: semanticColors.surfaceTransparent,
	notesButtonForeground: semanticColors.textPrimary,

	notesIndicatorForeground: semanticColors.textSecondary,

	durabilityForeground: semanticColors.textSecondary,
	durabilityPositiveChangeForeground: semanticColors.textSuccess,
	durabilityNegativeChangeForeground: semanticColors.textDanger,
})

export const reviewComposerColors = stylex.defineVars({
	containerBackground: semanticColors.surfaceRaised,
	containerShadow: semanticColors.shadowStrong,
})

export const cardActionsColors = stylex.defineVars({
	flashcardSelectedForeground: {
		default: amber.s400,
		'@media (prefers-color-scheme: dark)': amber.s400,
	},
	flagSelectedForeground: {
		default: orange.s500,
		'@media (prefers-color-scheme: dark)': orange.s500,
	},
	retiredSelectedForeground: {
		default: violet.s400,
		'@media (prefers-color-scheme: dark)': violet.s400,
	},
})

export const cardItemColors = stylex.defineVars({
	containerBackgroundHover: semanticColors.surfaceTransparentHover,
	containerForeground: semanticColors.textPrimary,

	titleForeground: semanticColors.textPrimary,
})

export const cardMetadataColors = stylex.defineVars({
	itemForeground: semanticColors.textSecondary,
	itemForegroundToday: semanticColors.textToday,
})

export const cardPropertiesColors = stylex.defineVars({
	containerBackground: semanticColors.surfaceSecondary,
	iconForeground: semanticColors.textSecondary,
	labelForeground: semanticColors.textSecondary,
	valueForeground: semanticColors.textPrimary,
	valueForegroundToday: semanticColors.textToday,
})

export const reviewDatePickerColors = stylex.defineVars({
	triggerForegroundToday: semanticColors.textToday,
	triggerForegroundOverdue: semanticColors.textDanger,
})

export const reviewSectionNavigationColors = stylex.defineVars({
	background: semanticColors.surfaceSecondary,
})

export const reviewsSidebarColors = stylex.defineVars({
	containerBackground: semanticColors.surfaceSecondary,

	seeAllForeground: semanticColors.textInteractive,
	seeAllForegroundHover: semanticColors.textInteractiveHover,
	seeAllForegroundPressed: semanticColors.textInteractiveActive,
})

export const searchDialogColors = stylex.defineVars({
	headerBorder: semanticColors.borderSubtle,
	searchIconForeground: semanticColors.textSecondary,

	inputBackground: semanticColors.surfaceTransparent,
	inputForeground: semanticColors.textPrimary,
	inputPlaceholderForeground: semanticColors.textSecondary,

	statusForeground: semanticColors.textSecondary,
})

export const searchResultGroupColors = stylex.defineVars({
	titleForeground: semanticColors.textSecondary,
	controlForeground: semanticColors.textSecondary,
})

export const searchResultItemColors = stylex.defineVars({
	background: semanticColors.surfaceTransparent,
	backgroundHover: semanticColors.surfaceTransparentHover,
	backgroundFocusVisible: semanticColors.surfaceTransparentActive,
	foreground: semanticColors.textPrimary,
	focusRingRest: semanticColors.surfaceTransparent,
	focusRing: semanticColors.borderFocus,

	secondaryForeground: semanticColors.textSecondary,
	pathForeground: semanticColors.textSecondary,
})
