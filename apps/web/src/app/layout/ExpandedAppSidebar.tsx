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
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	appSidebar,
	buttonSizes,
	fontSizes,
	fontWeights,
	iconWeights,
	layout,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	// Matches the gap AppShell leaves around the page surface.
	container: {
		padding: layout.appShellInset,
		// Separates the header and each section.
		gap: spacing.md,
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '240px',
	},
	// Same top padding as the page toolbars so the header centers with
	// breadcrumbs.
	brandRow: {
		alignItems: 'center',
		display: 'flex',
		paddingBlockStart: spacing.sm,
	},
	headerButton: {
		paddingBlock: 0,
		paddingInline: 0,
		blockSize: buttonSizes.small,
		inlineSize: buttonSizes.small,
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
	brandText: {
		// The lowercase descender makes the wordmark look slightly low beside centered icons.
		transform: 'translateY(-1px)',
	},
	actions: {
		display: 'flex',
		marginInlineStart: 'auto',
	},
	library: {
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
				<Button.Icon
					aria-label='Collapse sidebar'
					aria-expanded
					aria-controls={navId}
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
						strokeWidth={iconWeights.medium}
					/>
				</Button.Icon>
				<Link to='/review' {...stylex.props(styles.brand)}>
					<span {...stylex.props(styles.brandText)}>3gulp</span>
				</Link>
				<div {...stylex.props(styles.actions)}>
					<HideModeButton xstyle={styles.headerButton} />
					<SearchDialog triggerXstyle={styles.headerButton} />
				</div>
			</div>
			<ReviewNavigation />
			<div {...stylex.props(styles.library)}>
				<LibraryNavigation />
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
