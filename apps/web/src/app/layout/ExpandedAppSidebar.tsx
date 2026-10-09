import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { PanelLeft, Settings } from 'lucide-react'
import type { Ref } from 'react'

import { SidebarItem } from '~/components/sidebar'
import { Button } from '~/components/ui'
import { LibraryNavigation } from '~/modules/library/components/library-navigation/LibraryNavigation'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { ReviewNavigation } from '~/modules/reviews/components/review-navigation/ReviewNavigation'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import { appShellColors } from '~/styles/colors/components.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	appSidebar,
	fontSizes,
	fontWeights,
	layout,
	spacing,
} from '~/styles/tokens.stylex'

import { hideModeSidebarTheme } from './hideModeSidebarTheme'

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
		gap: spacing.sm,
		paddingInline: spacing.md,
		alignItems: 'center',
		display: 'flex',
		minBlockSize: '36px',
		paddingBlockEnd: spacing.xs,
		// Container padding plus the shell inset matches the collapsed toggle axis.
		paddingBlockStart: layout.appShellInset,
	},
	brandLabel: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'grid',
		gridTemplateColumns: `${appSidebar.iconSize} auto`,
	},
	headerButton: {
		paddingBlock: 0,
		paddingInline: 0,
		blockSize: '36px',
		inlineSize: '36px',
		justifySelf: 'center',
	},
	brand: {
		gap: spacing.xs,
		textDecoration: 'none',
		alignItems: 'center',
		color: {
			default: semanticColors.textInteractive,
			':hover': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
		},
		display: 'flex',
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		marginInlineStart: spacing.xs,
	},
	brandText: {
		// The lowercase descender makes the wordmark look slightly low beside centered icons.
		transform: 'translateY(-1px)',
	},
	actions: {
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
	id: string
	expanded: boolean
	onToggle: () => void
	toggleRef: Ref<HTMLButtonElement>
}

export function ExpandedAppSidebar({
	hideMode,
	id,
	expanded,
	onToggle,
	toggleRef,
}: ExpandedAppSidebarProps) {
	return (
		<nav
			id={id}
			aria-label='primary'
			{...stylex.props(
				styles.container,
				hideMode && hideModeSidebarTheme,
			)}
		>
			<div {...stylex.props(styles.brandRow)}>
				<div {...stylex.props(styles.brandLabel)}>
					<Button.Icon
						aria-label='Collapse sidebar'
						aria-expanded={expanded}
						aria-controls={id}
						onClick={onToggle}
						ref={toggleRef}
						shape='round'
						size='micro'
						variant='ghost'
						xstyle={styles.headerButton}
					>
						<PanelLeft
							aria-hidden='true'
							size={appSidebar.iconSize}
						/>
					</Button.Icon>
					<Link to='/review' {...stylex.props(styles.brand)}>
						<span {...stylex.props(styles.brandText)}>3gulp</span>
					</Link>
				</div>
				<div {...stylex.props(styles.actions)}>
					<HideModeButton xstyle={styles.headerButton} />
					<SearchDialog triggerXstyle={styles.headerButton} />
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
