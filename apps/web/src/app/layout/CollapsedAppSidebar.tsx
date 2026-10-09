import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import {
	BellRing,
	Calendar,
	Flag,
	PanelLeft,
	Settings,
	Sparkles,
} from 'lucide-react'
import type { Ref } from 'react'

import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { useReviewQueueCounts } from '~/modules/reviews/hooks/useReviewQueueCounts'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import {
	appShellColors,
	buttonColors,
	sidebarItemColors,
} from '~/styles/colors/components.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { appSidebar, layout, spacing } from '~/styles/tokens.stylex'

import { hideModeSidebarTheme } from './hideModeSidebarTheme'
import { SidebarRailReviewLink } from './SidebarRailReviewLink'

const styles = stylex.create({
	rail: {
		gap: spacing.sm,
		paddingInline: spacing.xs,
		alignItems: 'center',
		backgroundColor: appShellColors.chromeBackground,
		color: semanticColors.textPrimary,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		inlineSize: '48px',
		paddingBlockEnd: spacing.sm,
		// Add the shell inset so the toggle aligns with page toolbar controls.
		paddingBlockStart: `calc(${spacing.xs} + ${layout.appShellInset})`,
		height: '100%',
		overflowY: 'hidden',
	},
	// Top-level app controls share this 36px hit area across shell layouts.
	controlWrapper: {
		alignItems: 'center',
		blockSize: '36px',
		display: 'flex',
		inlineSize: '36px',
		justifyContent: 'center',
	},
	controlIcon: {
		blockSize: appSidebar.iconSize,
		inlineSize: appSidebar.iconSize,
	},
	railItem: {
		paddingBlock: 0,
		paddingInline: 0,
		blockSize: '36px',
		inlineSize: '36px',
	},
	railLink: {
		backgroundColor: {
			'[data-status=active]': sidebarItemColors.backgroundSelected,
			default: buttonColors.ghostBackground,
			':is([data-status=active]:hover)':
				sidebarItemColors.backgroundSelectedHover,
			':hover': buttonColors.ghostBackgroundHover,
		},
		color: {
			'[data-status=active]': sidebarItemColors.foregroundSelected,
			default: buttonColors.ghostForeground,
			':hover': buttonColors.ghostForegroundHover,
		},
	},
	spacer: {
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: spacing.xs,
	},
})

type CollapsedAppSidebarProps = {
	hideMode: boolean
	id: string
	expanded: boolean
	onToggle: () => void
	toggleRef: Ref<HTMLButtonElement>
}

export function CollapsedAppSidebar({
	hideMode,
	id,
	expanded,
	onToggle,
	toggleRef,
}: CollapsedAppSidebarProps) {
	const queues = useReviewQueueCounts()

	return (
		<nav
			id={id}
			aria-label='primary'
			{...stylex.props(styles.rail, hideMode && hideModeSidebarTheme)}
		>
			<Tooltip>
				<TooltipTrigger
					render={
						<span {...stylex.props(styles.controlWrapper)}>
							<Button.Icon
								aria-label='Expand sidebar'
								aria-expanded={expanded}
								aria-controls={id}
								onClick={onToggle}
								ref={toggleRef}
								shape='round'
								size='micro'
								variant='ghost'
								xstyle={styles.railItem}
							>
								<PanelLeft
									aria-hidden='true'
									size={appSidebar.iconSize}
								/>
							</Button.Icon>
						</span>
					}
				/>
				<TooltipContent side='right'>Expand sidebar</TooltipContent>
			</Tooltip>
			<HideModeButton tooltipSide='right' xstyle={styles.railItem} />
			<SearchDialog triggerXstyle={styles.railItem} />

			<SidebarRailReviewLink
				icon={Calendar}
				label='Due'
				queue={queues.due}
				to='/review/due'
			/>
			<SidebarRailReviewLink
				icon={Sparkles}
				label='New'
				queue={queues.new}
				to='/review/new'
			/>
			<SidebarRailReviewLink
				icon={BellRing}
				label='Late'
				queue={queues.late}
				to='/review/late'
			/>
			<SidebarRailReviewLink
				icon={Flag}
				label='Flagged'
				queue={queues.flagged}
				to='/review/flagged'
			/>

			<div aria-hidden='true' {...stylex.props(styles.spacer)} />
			<Tooltip>
				<TooltipTrigger
					render={
						<Button.Icon
							aria-label='Settings'
							render={
								<Link
									activeOptions={{ exact: true }}
									to='/settings'
								/>
							}
							shape='round'
							size='micro'
							variant='ghost'
							xstyle={[styles.railItem, styles.railLink]}
						>
							<Settings
								aria-hidden='true'
								{...stylex.props(styles.controlIcon)}
							/>
						</Button.Icon>
					}
				/>
				<TooltipContent side='right'>Settings</TooltipContent>
			</Tooltip>
		</nav>
	)
}
