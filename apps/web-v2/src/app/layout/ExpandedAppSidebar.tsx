import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { PanelLeft, Settings } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar'
import { Button } from '~/components/ui'
import { LibraryNavigation } from '~/modules/library/components/library-navigation/LibraryNavigation'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { ReviewNavigation } from '~/modules/reviews/components/review-navigation/ReviewNavigation'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import {
	appShellColors,
	buttonColors,
	libraryCollectionItemColors,
	librarySidebarColors,
	sidebarItemColors,
	sidebarSectionHeaderColors,
	treeColors,
} from '~/styles/colors/components.stylex'
import {
	baseColors,
	blue,
	slate,
	whiteAlpha,
} from '~/styles/colors/primitives.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

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

const hideModeOnItemTheme = stylex.createTheme(sidebarItemColors, {
	background: baseColors.transparent,
	backgroundHover: whiteAlpha.s10,
	backgroundSelected: whiteAlpha.s15,
	backgroundSelectedHover: whiteAlpha.s20,
	foreground: slate.s200,
	foregroundHover: whiteAlpha.s95,
	foregroundSelected: whiteAlpha.s95,
})

const hideModeOnSectionHeaderTheme = stylex.createTheme(
	sidebarSectionHeaderColors,
	{
		foreground: semanticColors.textTertiary,
	},
)

const hideModeOnButtonTheme = stylex.createTheme(buttonColors, {
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

const hideModeOnTreeTheme = stylex.createTheme(treeColors, {
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

const hideModeOnLibraryTheme = stylex.createTheme(librarySidebarColors, {
	containerBackgroundDropTarget: whiteAlpha.s10,
})

const hideModeOnCollectionItemTheme = stylex.createTheme(
	libraryCollectionItemColors,
	{
		containerBackgroundDragging: whiteAlpha.s5,
		containerBackgroundDropTarget: whiteAlpha.s10,
	},
)

const styles = stylex.create({
	container: {
		padding: spacing.xs,
		gap: spacing.xs,

		backgroundColor: appShellColors.chromeBackground,
		color: semanticColors.textPrimary,

		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,

		inlineSize: '240px',
		height: '100%',
		overflowY: 'hidden',
	},
	brandRow: {
		padding: spacing.sm,
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
		minBlockSize: '36px',
	},
	brandLabel: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'grid',
		gridTemplateColumns: `${iconSizes.md} auto`,
	},
	brandIcon: {
		justifySelf: 'center',
	},
	brand: {
		gap: spacing.xs,
		textDecoration: 'none',
		alignItems: 'center',
		color: 'inherit',
		display: 'flex',
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
	},
	actions: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		marginInlineStart: 'auto',
	},
	footer: {
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
	},
	library: {
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		inlineSize: '100%',
		minBlockSize: 0,
	},
})

type ExpandedAppSidebarProps = {
	hideMode: boolean
}

export function ExpandedAppSidebar({ hideMode }: ExpandedAppSidebarProps) {
	return (
		<nav
			aria-label='primary'
			{...stylex.props(
				styles.container,
				hideMode && hideModeOnSemanticTheme,
				hideMode && hideModeOnItemTheme,
				hideMode && hideModeOnSectionHeaderTheme,
				hideMode && hideModeOnButtonTheme,
				hideMode && hideModeOnTreeTheme,
				hideMode && hideModeOnLibraryTheme,
				hideMode && hideModeOnCollectionItemTheme,
			)}
		>
			<div {...stylex.props(styles.brandRow)}>
				<div {...stylex.props(styles.brandLabel)}>
					<Button.Icon
						shape='round'
						size='micro'
						variant='ghost'
						xstyle={styles.brandIcon}
					>
						<PanelLeft size={iconSizes.md} />
					</Button.Icon>
					<Link to='/review' {...stylex.props(styles.brand)}>
						<span>3gulp</span>
					</Link>
				</div>
				<div {...stylex.props(styles.actions)}>
					<HideModeButton />
					<SearchDialog />
				</div>
			</div>
			<ReviewNavigation />
			<div {...stylex.props(styles.library)}>
				<LibraryNavigation />
			</div>
			<div {...stylex.props(styles.footer)}>
				<SidebarItem
					icon={Settings}
					render={
						<Link activeOptions={{ exact: true }} to='/settings' />
					}
				>
					Settings
				</SidebarItem>
			</div>
		</nav>
	)
}
