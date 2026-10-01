import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

import {
	Button,
	StatusDot,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import type { ReviewQueueCount } from '~/modules/reviews/hooks/useReviewQueueCounts'
import {
	buttonColors,
	sidebarItemColors,
} from '~/styles/colors/components.stylex'
import { appSidebar, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	link: {
		paddingBlock: 0,
		paddingInline: 0,
		backgroundColor: {
			'[data-status=active]': sidebarItemColors.backgroundSelected,
			default: buttonColors.ghostBackground,
			':is([data-status=active]:hover)':
				sidebarItemColors.backgroundSelectedHover,
			':hover': buttonColors.ghostBackgroundHover,
		},
		blockSize: '36px',
		color: {
			'[data-status=active]': sidebarItemColors.foregroundSelected,
			default: buttonColors.ghostForeground,
			':hover': buttonColors.ghostForegroundHover,
		},
		inlineSize: '36px',
		position: 'relative',
	},
	icon: {
		blockSize: appSidebar.iconSize,
		inlineSize: appSidebar.iconSize,
	},
	statusDot: {
		insetBlockStart: spacing.xs,
		insetInlineEnd: spacing.xs,
		position: 'absolute',
	},
})

type SidebarRailReviewLinkProps = {
	icon: LucideIcon
	label: string
	queue: ReviewQueueCount
	to: '/review/due' | '/review/new' | '/review/late' | '/review/flagged'
}

export function SidebarRailReviewLink({
	icon: Icon,
	label,
	queue,
	to,
}: SidebarRailReviewLinkProps) {
	const name = queue.countLabel ?? label

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button.Icon
						aria-label={name}
						render={<Link to={to} />}
						shape='round'
						size='micro'
						variant='ghost'
						xstyle={styles.link}
					>
						<Icon
							aria-hidden='true'
							{...stylex.props(styles.icon)}
						/>
						{queue.count > 0 && (
							<StatusDot xstyle={styles.statusDot} />
						)}
					</Button.Icon>
				}
			/>
			<TooltipContent side='right'>{name}</TooltipContent>
		</Tooltip>
	)
}
