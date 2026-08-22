import * as stylex from '@stylexjs/stylex'

import { colors } from './colors.stylex'

export const breadcrumbColors = stylex.defineVars({
	linkForeground: colors.textLink,
	linkForegroundHover: colors.textLinkHover,
	linkForegroundPressed: colors.textLinkActive,
	linkFocusRingRest: colors.bgSurfaceTransparent,
	linkFocusRing: colors.borderFocus,

	listForeground: colors.textSecondary,
	pageForeground: colors.text,
})

export const buttonColors = stylex.defineVars({
	focusRingRest: colors.bgSurfaceTransparent,
	focusRing: colors.borderFocus,

	primaryBorder: colors.bgSurfaceTransparent,
	primaryBackground: colors.bgFillBrand,
	primaryBackgroundHover: colors.bgFillBrandHover,
	primaryBackgroundPressed: colors.bgFillBrandActive,
	primaryForeground: colors.textBrandOnBgFill,
	primaryForegroundHover: colors.textBrandOnBgFillHover,
	primaryForegroundPressed: colors.textBrandOnBgFillActive,

	secondaryBorder: colors.bgSurfaceTransparent,
	secondaryBackground: colors.bgFillSecondary,
	secondaryBackgroundHover: colors.bgFillSecondaryHover,
	secondaryBackgroundPressed: colors.bgFillSecondaryActive,
	secondaryForeground: colors.textInteractive,
	secondaryForegroundHover: colors.textInteractiveHover,
	secondaryForegroundPressed: colors.textInteractiveActive,

	outlineBorder: colors.borderTertiary,
	outlineBackground: colors.bgFillTertiary,
	outlineBackgroundHover: colors.bgFillTertiaryHover,
	outlineBackgroundPressed: colors.bgFillTertiaryActive,
	outlineForeground: colors.textInteractive,
	outlineForegroundHover: colors.textInteractiveHover,
	outlineForegroundPressed: colors.textInteractiveActive,

	ghostBorder: colors.bgSurfaceTransparent,
	ghostBackground: colors.bgSurfaceTransparent,
	ghostBackgroundHover: colors.bgFillTransparentHover,
	ghostBackgroundPressed: colors.bgFillTransparentActive,
	ghostForeground: colors.textInteractive,
	ghostForegroundHover: colors.textInteractiveHover,
	ghostForegroundPressed: colors.textInteractiveActive,

	dangerPrimaryBorder: colors.bgSurfaceTransparent,
	dangerPrimaryBackground: colors.bgFillDanger,
	dangerPrimaryBackgroundHover: colors.bgFillDangerHover,
	dangerPrimaryBackgroundPressed: colors.bgFillDangerActive,
	dangerPrimaryForeground: colors.textDangerOnBgFill,
	dangerPrimaryInsetBorder: colors.insetContrast,

	dangerSecondaryBorder: colors.bgSurfaceTransparent,
	dangerSecondaryBackground: colors.bgFillDangerSecondary,
	dangerSecondaryBackgroundHover: colors.bgFillDangerSecondaryHover,
	dangerSecondaryBackgroundPressed: colors.bgFillDangerSecondaryActive,
	dangerSecondaryForeground: colors.textDanger,
	dangerSecondaryForegroundHover: colors.textDangerHover,
	dangerSecondaryForegroundPressed: colors.textDangerActive,

	dangerOutlineBorder: colors.borderDanger,
	dangerOutlineBorderHover: colors.borderDangerHover,
	dangerOutlineBorderPressed: colors.borderDangerActive,
	dangerOutlineBackground: colors.bgFillDangerTertiary,
	dangerOutlineBackgroundHover: colors.bgFillDangerTertiaryHover,
	dangerOutlineBackgroundPressed: colors.bgFillDangerTertiaryActive,
	dangerOutlineForeground: colors.textDanger,
	dangerOutlineForegroundHover: colors.textDangerHover,
	dangerOutlineForegroundPressed: colors.textDangerActive,

	dangerGhostBorder: colors.bgSurfaceTransparent,
	dangerGhostBackground: colors.bgSurfaceTransparent,
	dangerGhostBackgroundHover: colors.bgFillDangerTransparentHover,
	dangerGhostBackgroundPressed: colors.bgFillDangerTransparentActive,
	dangerGhostForeground: colors.textDanger,
	dangerGhostForegroundHover: colors.textDangerHover,
	dangerGhostForegroundPressed: colors.textDangerActive,

	primaryDisabledBorder: colors.bgSurfaceTransparent,
	primaryDisabledBackground: colors.bgFillBrandDisabled,
	primaryDisabledForeground: colors.textBrandOnBgFillDisabled,

	disabledBorder: colors.borderDisabled,
	disabledBackground: colors.bgFillDisabled,
	disabledForeground: colors.textDisabled,
})

export const calendarColors = stylex.defineVars({
	navButtonBorder: colors.bgSurfaceTransparent,
	navButtonBackground: colors.bgSurfaceTransparent,
	navButtonBackgroundHover: colors.bgFillTransparentHover,
	navButtonBackgroundPressed: colors.bgFillTransparentActive,
	navButtonForeground: colors.textInteractive,
	navButtonFocusRingRest: colors.bgSurfaceTransparent,
	navButtonFocusRing: colors.borderFocus,

	weekdayForeground: colors.textSecondary,

	dayButtonBorder: colors.bgSurfaceTransparent,
	dayButtonBackground: colors.bgSurfaceTransparent,
	dayButtonBackgroundHover: colors.bgFillTransparentHover,
	dayButtonBackgroundSelected: colors.bgFillBrand,
	dayButtonBackgroundSelectedHover: colors.bgFillBrandHover,
	dayButtonBackgroundToday: colors.bgSurfaceInfo,
	dayButtonBackgroundTodayHover: colors.bgSurfaceInfoHover,
	dayButtonForeground: colors.text,
	dayButtonForegroundSelected: colors.textBrandOnBgFill,
	dayButtonFocusRingRest: colors.bgSurfaceTransparent,
	dayButtonFocusRing: colors.borderFocus,
})

export const dialogColors = stylex.defineVars({
	overlayBackground: colors.backdropBg,

	popupBorder: colors.border,
	popupBackground: colors.bgSurface,
	popupForeground: colors.text,
	popupShadow: colors.shadowStrong,

	fullscreenBackground: colors.bg,

	closeButtonBorder: colors.bgSurfaceTransparent,
	closeButtonBackground: colors.bgSurfaceTransparent,
	closeButtonBackgroundHover: colors.bgFillTransparentHover,
	closeButtonBackgroundPressed: colors.bgFillTransparentActive,
	closeButtonFocusRingRest: colors.bgSurfaceTransparent,
	closeButtonFocusRing: colors.borderFocus,

	descriptionForeground: colors.textSecondary,
})

export const dropdownMenuColors = stylex.defineVars({
	popupBorder: colors.border,
	popupBackground: colors.bgSurface,
	popupForeground: colors.text,
	popupShadow: colors.shadowSubtle,

	itemBackground: colors.bgSurfaceTransparent,
	itemBackgroundHighlighted: colors.bgSurfaceSecondaryHover,
	itemForeground: colors.textInteractive,
	itemForegroundHighlighted: colors.textInteractiveHover,
	itemForegroundPressed: colors.textInteractiveActive,

	subTriggerBackground: colors.bgSurfaceTransparent,
	subTriggerBackgroundHighlighted: colors.bgSurfaceSecondaryHover,
	subTriggerForeground: colors.textInteractive,
	subTriggerForegroundHighlighted: colors.textInteractiveHover,
	subTriggerForegroundPressed: colors.textInteractiveActive,

	shortcutForeground: colors.textSecondary,
	separatorBackground: colors.borderSecondary,
})

export const popoverColors = stylex.defineVars({
	popupBorder: colors.border,
	popupBackground: colors.bgSurface,
	popupForeground: colors.text,
	popupShadow: colors.shadowSubtle,
})

export const separatorColors = stylex.defineVars({
	background: colors.borderSecondary,
})

export const toasterColors = stylex.defineVars({
	normalBackground: colors.bgSurface,
	normalBorder: colors.border,
	normalForeground: colors.text,

	infoBackground: colors.bgSurfaceInfo,
	infoBorder: colors.borderInfo,
	infoForeground: colors.textInfo,

	successBackground: colors.bgSurfaceSuccess,
	successBorder: colors.borderSuccess,
	successForeground: colors.textSuccess,

	warningBackground: colors.bgSurfaceWarning,
	warningBorder: colors.borderWarning,
	warningForeground: colors.textWarning,

	errorBackground: colors.bgSurfaceDanger,
	errorBorder: colors.borderDanger,
	errorForeground: colors.textDanger,
})

export const tabsColors = stylex.defineVars({
	listBackground: colors.bgSurfaceSecondary,
	listForeground: colors.textSecondary,
	lineListBorder: colors.borderSecondary,
	lineListBorderRest: colors.bgSurfaceTransparent,

	triggerBorder: colors.bgSurfaceTransparent,
	triggerBackground: colors.bgSurfaceTransparent,
	triggerForeground: colors.textInteractive,
	triggerForegroundHover: colors.textInteractiveHover,
	triggerForegroundPressed: colors.textInteractiveActive,
	triggerForegroundSelected: colors.textInteractiveActive,
	triggerForegroundDisabled: colors.textDisabled,
	triggerFocusRingRest: colors.bgSurfaceTransparent,
	triggerFocusRing: colors.borderFocus,

	defaultTriggerBackground: colors.bgSurfaceTransparent,
	defaultTriggerBackgroundSelected: colors.bgFillTransparentSelected,
	defaultTriggerShadowSelected: colors.shadowSubtle,

	lineTriggerBorderRest: colors.bgSurfaceTransparent,
	lineTriggerBorderSelected: colors.borderBrand,

	contentFocusRingRest: colors.bgSurfaceTransparent,
	contentFocusRing: colors.borderFocus,
})

export const textareaColors = stylex.defineVars({
	border: colors.bgSurfaceTransparent,
	background: colors.bgSurfaceTransparent,
	foreground: colors.text,
	foregroundDisabled: colors.textDisabled,
	focusRingRest: colors.bgSurfaceTransparent,
	placeholderForeground: colors.textSecondary,
})

export const tooltipColors = stylex.defineVars({
	popupBackground: colors.bgSurfaceInverse,
	popupForeground: colors.textInverse,
	popupShadow: colors.shadowSubtle,
})

export const treeColors = stylex.defineVars({
	itemBackgroundHover: colors.navBgSurfaceHover,
	itemBackgroundSelected: colors.navBgSurfaceActive,
	itemBackgroundSelectedHover: colors.navBgSurfaceActive,

	labelBackground: colors.bgSurfaceTransparent,
	labelForeground: colors.textLink,
	labelForegroundHover: colors.textLinkHover,
	labelForegroundSelected: colors.textLinkActive,
	labelFocusRingRest: colors.bgSurfaceTransparent,
	labelFocusRing: colors.borderFocus,
})

export const appShellColors = stylex.defineVars({
	background: colors.bg,
	foreground: colors.text,
})

export const appSidebarColors = stylex.defineVars({
	background: colors.navBg,
	border: colors.borderSecondary,
})

export const loadingIndicatorColors = stylex.defineVars({
	foreground: colors.textSecondary,
})

export const sidebarItemColors = stylex.defineVars({
	background: colors.bg,
	backgroundHover: colors.navBgSurfaceHover,
	backgroundSelected: colors.navBgSurfaceActive,
	backgroundSelectedHover: colors.navBgSurfaceActive,

	foreground: colors.textLink,
	foregroundHover: colors.textLinkHover,
	foregroundSelected: colors.textLinkActive,
})

export const notAuthenticatedPageColors = stylex.defineVars({
	loadingIndicatorForeground: colors.textSecondary,
})

export const librarySidebarColors = stylex.defineVars({
	headerBackgroundDropTarget: colors.navBgSurfaceActive,
})

export const libraryTopicItemColors = stylex.defineVars({
	containerBackgroundDragging: colors.navBgSurface,
	containerBackgroundDropTarget: colors.navBgSurfaceActive,
})

export const moveTopicDialogColors = stylex.defineVars({
	treeBorder: colors.border,
	statusForeground: colors.textSecondary,
})

export const focusOverlayColors = stylex.defineVars({
	containerBackground: colors.bgSurface,
	cardBackground: colors.bg,

	positionForeground: colors.textSecondary,
	emptyForeground: colors.textSecondary,
})

export const focusOverlayCardErrorColors = stylex.defineVars({
	messageForeground: colors.textSecondary,
})

export const hideModeButtonColors = stylex.defineVars({
	selectedBackground: colors.bgSurfaceInfo,
	selectedBackgroundHover: colors.bgSurfaceInfoHover,
	selectedForeground: colors.textInfo,
})

export const hideableColors = stylex.defineVars({
	placeholderBackground: colors.bgFillSecondary,
})

export const reviewColors = stylex.defineVars({
	rowBackground: colors.bgSurfaceTransparent,

	ratingBadgeBackground: colors.bgFillBrand,
	ratingBadgeForeground: colors.textBrandOnBgFill,

	notesButtonBackground: colors.bgSurfaceTransparent,
	notesButtonForeground: colors.text,

	notesIndicatorForeground: colors.textSecondary,
})

export const reviewCardActionsColors = stylex.defineVars({
	flashcardSelectedForeground: colors.iconFlashcardActive,
	flagSelectedForeground: colors.iconFlagActive,
})

export const reviewCardItemColors = stylex.defineVars({
	containerBackgroundHover: colors.bgFillHover,
	containerForeground: colors.text,

	titleForeground: colors.text,
})

export const reviewCardMetadataColors = stylex.defineVars({
	itemForeground: colors.textSecondary,
})

export const reviewDatePickerColors = stylex.defineVars({
	triggerForegroundToday: colors.textInfo,
	triggerForegroundOverdue: colors.textDanger,

	popoverBackground: colors.bg,
})

export const reviewsSidebarColors = stylex.defineVars({
	containerBackground: colors.bgSurfaceSecondary,

	seeAllForeground: colors.textLink,
	seeAllForegroundHover: colors.textLinkHover,
	seeAllForegroundPressed: colors.textLinkActive,
})

export const searchDialogColors = stylex.defineVars({
	popupBorder: colors.borderSecondary,
	popupBackground: colors.bg,

	headerBorder: colors.borderSecondary,
	searchIconForeground: colors.textSecondary,

	inputBackground: colors.bgSurfaceTransparent,
	inputForeground: colors.text,
	inputPlaceholderForeground: colors.textSecondary,

	statusForeground: colors.textSecondary,
})

export const searchResultGroupColors = stylex.defineVars({
	titleForeground: colors.textSecondary,
	controlForeground: colors.textSecondary,
	emptyForeground: colors.textSecondary,
})

export const searchResultItemColors = stylex.defineVars({
	background: colors.bgSurfaceTransparent,
	backgroundHover: colors.bgSurfaceHover,
	backgroundFocusVisible: colors.bgSurfaceHover,
	foreground: colors.text,
	focusRingRest: colors.bgSurfaceTransparent,
	focusRing: colors.borderFocus,

	secondaryForeground: colors.textSecondary,
	pathForeground: colors.textSecondary,
})

export const basicRoutePageColors = stylex.defineVars({
	descriptionForeground: colors.textSecondary,
})

export const reviewListPageColors = stylex.defineVars({
	emptyForeground: colors.textSecondary,
})

export const reviewCardPageShellColors = stylex.defineVars({
	headerBorder: colors.border,
	tabsBackground: colors.bgSurfaceTransparent,
})
