import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { PanelLeft, Settings } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar'
import { Button } from '~/components/ui'
import { LibraryNavigation } from '~/modules/library/components/library-navigation/LibraryNavigation'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { ReviewNavigation } from '~/modules/reviews/components/review-navigation/ReviewNavigation'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import { appShellColors } from '~/styles/colors/components.stylex'
import {
	hideModeButtonTheme,
	hideModeLibraryCollectionItemTheme,
	hideModeLibrarySidebarTheme,
	hideModeSidebarButtonTheme,
	hideModeSidebarItemTheme,
	hideModeSidebarSectionHeaderTheme,
	hideModeSidebarTheme,
	hideModeTreeTheme,
} from '~/styles/colors/hideModeThemes'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'

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

type AppSidebarProps = {
	hideMode: boolean
}

export function AppSidebar({ hideMode }: AppSidebarProps) {
	return (
		<nav
			aria-label='primary'
			{...stylex.props(
				styles.container,
				hideMode && hideModeSidebarTheme,
				hideMode && hideModeSidebarItemTheme,
				hideMode && hideModeSidebarSectionHeaderTheme,
				hideMode && hideModeSidebarButtonTheme,
				hideMode && hideModeTreeTheme,
				hideMode && hideModeLibrarySidebarTheme,
				hideMode && hideModeLibraryCollectionItemTheme,
				hideMode && hideModeButtonTheme,
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
