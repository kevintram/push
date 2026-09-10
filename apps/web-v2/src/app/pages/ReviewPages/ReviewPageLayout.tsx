import * as stylex from '@stylexjs/stylex'
import { Link, Outlet, useLayoutEffect } from '@tanstack/react-router'
import { BellRing, Calendar, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

import { SidebarItem } from '~/components/sidebar-item'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import {
	appShellColors,
	reviewSectionNavigationColors,
} from '~/styles/colors/components.stylex'
import { breakpoints, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	layout: {
		overflow: 'hidden',

		display: 'flex',
		flexDirection: 'row',

		height: '100%',

		backgroundColor: reviewSectionNavigationColors.background,
	},
	sectionNavigation: {
		position: 'sticky',
		top: 0,

		padding: spacing.sm,
		minInlineSize: '180px',

		backgroundColor: reviewSectionNavigationColors.background,

		gap: spacing.xs,
		display: 'flex',
		flexDirection: 'column',
	},
	main: {
		overflow: 'hidden',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		position: 'relative',
		zIndex: 1,
		minWidth: 0,

		backgroundColor: appShellColors.surfaceBackground,
		boxShadow: {
			default: 'none',
			[breakpoints.tablet]: `-1px 0 4px ${appShellColors.surfaceShadow}`,
		},
		borderBottomLeftRadius: {
			default: 0,
			[breakpoints.tablet]: radii.xl,
		},
		borderTopLeftRadius: {
			default: 0,
			[breakpoints.tablet]: radii.xl,
		},
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		minHeight: 0,
		minWidth: 0,
		width: '100%',
	},
})

export function ReviewPageLayout() {
	const { hideMode, setHideMode } = useHideMode()
	const hideModeAutomaticallyActivated = useRef(false)

	useLayoutEffect(() => {
		// Automatically turn on hideMode when navigating to any of the ReviewPages.
		// (Because why would you want to see the answers when you're trying to review.)
		if (!hideModeAutomaticallyActivated.current) {
			hideModeAutomaticallyActivated.current = true
			if (hideMode !== 'on') {
				setHideMode('on')
				toast.info('Hide mode has been turned on.')
			}
		}
	}, [hideMode, setHideMode])

	return (
		<div {...stylex.props(styles.layout)}>
			<nav
				aria-label='review sections'
				{...stylex.props(styles.sectionNavigation)}
			>
				<SidebarItem
					icon={Calendar}
					layout='skinny'
					render={<Link to='/review/due' />}
					text='Due'
				/>
				<SidebarItem
					icon={Sparkles}
					layout='skinny'
					render={<Link to='/review/new' />}
					text='New'
				/>
				<SidebarItem
					icon={BellRing}
					layout='skinny'
					render={<Link to='/review/late' />}
					text='Late'
				/>
			</nav>
			<div {...stylex.props(styles.main)}>
				<div {...stylex.props(styles.content)}>
					<Outlet />
				</div>
			</div>
		</div>
	)
}
