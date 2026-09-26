import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BellRing, Calendar, ChevronDown, Flag, Sparkles } from 'lucide-react'

import { SidebarItem } from '~/components/sidebar'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	StatusDot,
} from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { dueQueries } from '~/modules/reviews/api/dueQueries'
import { sidebarSectionHeaderColors } from '~/styles/colors/components.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

const styles = stylex.create({
	section: {
		display: 'flex',
		flexDirection: 'column',
	},
	header: {
		alignItems: 'center',
		display: 'flex',
		inlineSize: '100%',
		minBlockSize: '36px',
	},
	toggle: {
		borderWidth: 0,
		gap: spacing.xs,
		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,

		borderRadius: radii.lg,
		alignItems: 'center',
		backgroundColor: 'transparent',
		color: sidebarSectionHeaderColors.foreground,
		cursor: 'pointer',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		fontFamily: 'inherit',
		fontSize: fontSizes.md,
		fontWeight: fontWeights.regular,
		minInlineSize: 0,
		textAlign: 'start',
	},
	chevron: {
		blockSize: iconSizes.sm,
		flexShrink: 0,
		inlineSize: iconSizes.sm,
		opacity: {
			default: 0,
			[stylex.when.ancestor(':focus-within')]: 1,
			[stylex.when.ancestor(':hover')]: 1,
		},
	},
	chevronCollapsed: {
		transform: 'rotate(-90deg)',
	},
	items: {
		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
	statusDotWrapper: {
		paddingInline: spacing.sm,
		display: 'flex',
		marginInlineStart: 'auto',
	},
})

export function ReviewNavigation() {
	const today = useToday()
	// TODO(3): Replace these full-list subscriptions with count or exists queries.
	// TODO(2): Handle query errors instead of showing missing status dots as empty queues.
	const { data: dueEntries } = useQuery(dueQueries.listDue(today))
	const { data: newEntries } = useQuery(dueQueries.listNew())
	const { data: lateEntries } = useQuery(dueQueries.listLate(today))
	const { data: flaggedCards } = useQuery(cardQueries.listFlagged())

	const hasDue = (dueEntries?.length ?? 0) > 0
	const hasNew = (newEntries?.length ?? 0) > 0
	const hasLate = (lateEntries?.length ?? 0) > 0
	const hasFlagged = (flaggedCards?.length ?? 0) > 0

	return (
		<Collapsible
			defaultOpen
			render={<section aria-label='Review' />}
			xstyle={styles.section}
		>
			<div {...stylex.props(stylex.defaultMarker(), styles.header)}>
				<CollapsibleTrigger
					render={(renderProps, { open }) => (
						<button
							{...renderProps}
							aria-label={`${open ? 'Collapse' : 'Expand'} Review`}
							type='button'
						>
							<span>Review</span>
							<ChevronDown
								aria-hidden='true'
								{...stylex.props(
									styles.chevron,
									!open && styles.chevronCollapsed,
								)}
							/>
						</button>
					)}
					xstyle={styles.toggle}
				/>
			</div>
			<CollapsibleContent
				render={<nav aria-label='review sections' />}
				xstyle={styles.items}
			>
				<SidebarItem
					ariaLabel={hasDue ? 'Due, cards available' : undefined}
					icon={Calendar}
					render={<Link to='/review/due' />}
				>
					Due
					{hasDue && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
				<SidebarItem
					ariaLabel={hasNew ? 'New, cards available' : undefined}
					icon={Sparkles}
					render={<Link to='/review/new' />}
				>
					New
					{hasNew && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
				<SidebarItem
					ariaLabel={hasLate ? 'Late, cards available' : undefined}
					icon={BellRing}
					render={<Link to='/review/late' />}
				>
					Late
					{hasLate && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
				<SidebarItem
					ariaLabel={
						hasFlagged ? 'Flagged, cards available' : undefined
					}
					icon={Flag}
					render={<Link to='/review/flagged' />}
				>
					Flagged
					{hasFlagged && (
						<span {...stylex.props(styles.statusDotWrapper)}>
							<StatusDot />
						</span>
					)}
				</SidebarItem>
			</CollapsibleContent>
		</Collapsible>
	)
}
