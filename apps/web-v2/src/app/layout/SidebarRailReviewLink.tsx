import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar'
import {
	StatusDot,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	link: {
		paddingBlock: 0,
		paddingInline: 0,
		blockSize: '36px',
		inlineSize: '36px',
		position: 'relative',
	},
	icon: {
		blockSize: iconSizes.md,
		inlineSize: iconSizes.md,
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
	to: '/review/due' | '/review/new' | '/review/late' | '/review/flagged'
	hasCards: boolean
}

export function SidebarRailReviewLink({
	icon: Icon,
	label,
	to,
	hasCards,
}: SidebarRailReviewLinkProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<SidebarItem.Icon
						ariaLabel={
							hasCards ? `${label}, cards available` : label
						}
						render={<Link to={to} />}
						xstyle={styles.link}
					>
						<Icon
							aria-hidden='true'
							{...stylex.props(styles.icon)}
						/>
						{hasCards && (
							<span {...stylex.props(styles.statusDot)}>
								<StatusDot />
							</span>
						)}
					</SidebarItem.Icon>
				}
			/>
			<TooltipContent side='right'>{label}</TooltipContent>
		</Tooltip>
	)
}
