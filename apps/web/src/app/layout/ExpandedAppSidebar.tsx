import * as stylex from '@stylexjs/stylex'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { Link } from '@tanstack/react-router'
import { PanelLeft, Settings } from 'lucide-react'
import type { Ref } from 'react'

import { SidebarItem } from '~/components/sidebar'
import { Kbd, Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { CollectionsNavigation } from '~/modules/collections/components/collections-navigation/CollectionsNavigation'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { ReviewNavigation } from '~/modules/reviews/components/review-navigation/ReviewNavigation'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	appSidebar,
	fontSizes,
	fontWeights,
	layout,
	spacing,
} from '~/styles/tokens.stylex'

import { SIDEBAR_HOTKEY } from './sidebarHotkey'

const styles = stylex.create({
	// Matches the gap AppShell leaves around the page surface.
	container: {
		padding: layout.appShellInset,
		// Separates the header and each section.
		gap: spacing.md,
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
		inlineSize: appSidebar.width,
	},
	brandRow: {
		alignItems: 'center',
		display: 'flex',
		paddingBlockStart: layout.topBarInset,
	},
	brand: {
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
		marginInlineStart: spacing['2xs'],
	},
	actions: {
		display: 'flex',
		marginInlineStart: 'auto',
	},
	collections: {
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minBlockSize: 0,
	},
})

type ExpandedAppSidebarProps = {
	navId: string
	onToggle: () => void
	toggleRef: Ref<HTMLButtonElement>
}

export function ExpandedAppSidebar({
	navId,
	onToggle,
	toggleRef,
}: ExpandedAppSidebarProps) {
	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.brandRow)}>
				<Tooltip>
					<TooltipTrigger
						render={
							<SidebarItem
								aria-label='Collapse sidebar'
								aria-expanded
								aria-controls={navId}
								icon={PanelLeft}
								iconOnly
								onClick={onToggle}
								ref={toggleRef}
							/>
						}
					/>
					<TooltipContent side='bottom'>
						Collapse sidebar
						<Kbd>{formatForDisplay(SIDEBAR_HOTKEY)}</Kbd>
					</TooltipContent>
				</Tooltip>
				<Link to='/review' {...stylex.props(styles.brand)}>
					3gulp
				</Link>
				<div {...stylex.props(styles.actions)}>
					<HideModeButton showLabel />
					<SearchDialog />
				</div>
			</div>
			<ReviewNavigation />
			<div {...stylex.props(styles.collections)}>
				<CollectionsNavigation />
			</div>
			<SidebarItem
				icon={Settings}
				render={<Link activeOptions={{ exact: true }} to='/settings' />}
			>
				Settings
			</SidebarItem>
		</div>
	)
}
