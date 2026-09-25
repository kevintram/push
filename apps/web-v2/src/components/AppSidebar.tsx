import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Flag, Settings } from 'lucide-react'

import { LibrarySidebar } from '~/modules/library/components/library-sidebar/LibrarySidebar'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import { appShellColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import { ReviewNavigation } from './ReviewNavigation'
import { SidebarItem } from './sidebar-item'

const styles = stylex.create({
	container: {
		padding: spacing.xs,
		gap: spacing.xs,

		backgroundColor: appShellColors.chromeBackground,

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
	brand: {
		gap: spacing.xs,
		textDecoration: 'none',
		alignItems: 'center',
		color: 'inherit',
		display: 'flex',
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
	},
	search: {
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

export function AppSidebar() {
	return (
		<nav aria-label='primary' {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.brandRow)}>
				<Link to='/review' {...stylex.props(styles.brand)}>
					<span>3gulp</span>
				</Link>
				<div {...stylex.props(styles.search)}>
					<SearchDialog />
				</div>
			</div>
			<ReviewNavigation />
			<SidebarItem
				icon={Flag}
				render={<Link activeOptions={{ exact: true }} to='/flagged' />}
			>
				Flagged
			</SidebarItem>
			<div {...stylex.props(styles.library)}>
				<LibrarySidebar />
			</div>
			<div {...stylex.props(styles.footer)}>
				<HideModeButton />
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
