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

import { SidebarItem } from '~/components/sidebar'
import {
	Button,
	StatusDot,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { HideModeButton } from '~/modules/reviews/components/HideModeButton'
import { useReviewQueueCounts } from '~/modules/reviews/hooks/useReviewQueueCounts'
import { SearchDialog } from '~/modules/search/components/SearchDialog'
import {
	appSidebar,
	iconWeights,
	layout,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	rail: {
		gap: spacing.sm,
		paddingInline: spacing.xs,
		alignItems: 'center',
		blockSize: '100%',
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '48px',
		paddingBlockEnd: spacing.sm,
		// Add the shell inset so the toggle aligns with page toolbar controls.
		paddingBlockStart: `calc(${spacing.xs} + ${layout.appShellInset})`,
	},
	// Top-level app controls share this 36px hit area across shell layouts.
	controlWrapper: {
		alignItems: 'center',
		blockSize: '36px',
		display: 'flex',
		inlineSize: '36px',
		justifyContent: 'center',
	},
	railItem: {
		paddingBlock: 0,
		paddingInline: 0,
		blockSize: '36px',
		inlineSize: '36px',
	},
	// Round to match the rail's Button.Icon controls.
	railLink: {
		borderRadius: radii.full,
		position: 'relative',
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

const reviewLinks = [
	{ icon: Calendar, label: 'Due', queueKey: 'due', to: '/review/due' },
	{ icon: Sparkles, label: 'New', queueKey: 'new', to: '/review/new' },
	{ icon: BellRing, label: 'Late', queueKey: 'late', to: '/review/late' },
	{
		icon: Flag,
		label: 'Flagged',
		queueKey: 'flagged',
		to: '/review/flagged',
	},
] as const

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
							<Button.Icon
								aria-label='Expand sidebar'
								aria-expanded={false}
								aria-controls={navId}
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
									strokeWidth={iconWeights.medium}
								/>
							</Button.Icon>
						</span>
					}
				/>
				<TooltipContent side='right'>Expand sidebar</TooltipContent>
			</Tooltip>
			<HideModeButton tooltipSide='right' xstyle={styles.railItem} />
			<SearchDialog triggerXstyle={styles.railItem} />

			{reviewLinks.map(({ icon: Icon, label, queueKey, to }) => {
				const queue = queues[queueKey]
				const name = queue.countLabel ?? label
				return (
					<Tooltip key={to}>
						<TooltipTrigger
							render={
								<SidebarItem.Icon
									ariaLabel={name}
									render={<Link to={to} />}
									xstyle={styles.railLink}
								>
									<Icon
										aria-hidden='true'
										size={appSidebar.iconSize}
										strokeWidth={iconWeights.medium}
									/>
									{queue.count > 0 && (
										<StatusDot xstyle={styles.statusDot} />
									)}
								</SidebarItem.Icon>
							}
						/>
						<TooltipContent side='right'>{name}</TooltipContent>
					</Tooltip>
				)
			})}

			<div aria-hidden='true' {...stylex.props(styles.spacer)} />
			<Tooltip>
				<TooltipTrigger
					render={
						<SidebarItem.Icon
							ariaLabel='Settings'
							render={
								<Link
									activeOptions={{ exact: true }}
									to='/settings'
								/>
							}
							xstyle={styles.railLink}
						>
							<Settings
								aria-hidden='true'
								size={appSidebar.iconSize}
								strokeWidth={iconWeights.medium}
							/>
						</SidebarItem.Icon>
					}
				/>
				<TooltipContent side='right'>Settings</TooltipContent>
			</Tooltip>
		</div>
	)
}
