import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { PanelLeft, Settings } from 'lucide-react'
import type { Ref } from 'react'

import { SidebarItem } from '~/components/sidebar'
import {
	StatusDot,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { useReviewQueueCounts } from '~/modules/reviews/hooks/useReviewQueueCounts'
import { REVIEW_LINKS } from '~/modules/reviews/reviewLinks'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'
import { layout, spacing } from '~/styles/tokens.stylex'

import { CollectionsRailPopover } from './CollectionsRailPopover'

const styles = stylex.create({
	// Matches the gap AppShell leaves around the page surface.
	rail: {
		padding: layout.appShellInset,
		// Separates each group, matching the expanded sidebar's sections.
		gap: spacing.md,
		alignItems: 'center',
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
	},
	controlWrapper: {
		display: 'flex',
		// Matches the expanded sidebar's header so the toggle stays put.
		marginBlockStart: layout.topBarInset,
	},
	group: {
		display: 'flex',
		flexDirection: 'column',
	},
	statusDot: {
		insetBlockStart: spacing.xs,
		insetInlineEnd: spacing.xs,
		position: 'absolute',
	},
	spacer: {
		flexBasis: 0,
		flexGrow: 1,
		minBlockSize: spacing.xs,
	},
})

type CollapsedAppSidebarProps = {
	navId: string
	onToggle: () => void
	toggleRef: Ref<HTMLButtonElement>
}

export function CollapsedAppSidebar({
	navId,
	onToggle,
	toggleRef,
}: CollapsedAppSidebarProps) {
	const queues = useReviewQueueCounts()

	return (
		<div {...stylex.props(styles.rail)}>
			<Tooltip>
				<TooltipTrigger
					render={
						<span {...stylex.props(styles.controlWrapper)}>
							<SidebarItem
								aria-label='Expand sidebar'
								aria-expanded={false}
								aria-controls={navId}
								icon={PanelLeft}
								iconOnly
								onClick={onToggle}
								ref={toggleRef}
							/>
						</span>
					}
				/>
				<TooltipContent side='right'>
					Expand sidebar
					<ShortcutKeys hotkey={appHotkeys.toggleSidebar} />
				</TooltipContent>
			</Tooltip>
			<div {...stylex.props(styles.group)}>
				<HideModeButton tooltipSide='right' />
				<SearchDialog tooltipSide='right' />
			</div>

			<div {...stylex.props(styles.group)}>
				{REVIEW_LINKS.map(({ icon, label, queueKey, to, hotkey }) => {
					const queue = queues[queueKey]
					const name = queue.countLabel ?? label
					return (
						<Tooltip key={to}>
							<TooltipTrigger
								render={
									<SidebarItem
										aria-label={name}
										icon={icon}
										iconOnly
										render={<Link to={to} />}
									>
										{queue.count > 0 && (
											<StatusDot
												xstyle={styles.statusDot}
											/>
										)}
									</SidebarItem>
								}
							/>
							<TooltipContent side='right'>
								{name}
								<ShortcutKeys hotkey={hotkey} />
							</TooltipContent>
						</Tooltip>
					)
				})}
			</div>

			<CollectionsRailPopover />

			<div aria-hidden='true' {...stylex.props(styles.spacer)} />
			<Tooltip>
				<TooltipTrigger
					render={
						<SidebarItem
							aria-label='Settings'
							icon={Settings}
							iconOnly
							render={
								<Link
									activeOptions={{ exact: true }}
									to='/settings'
								/>
							}
						/>
					}
				/>
				<TooltipContent side='right'>Settings</TooltipContent>
			</Tooltip>
		</div>
	)
}
