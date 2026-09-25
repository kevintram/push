import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { appShellColors } from '~/styles/colors/components.stylex'
import { breakpoints, radii } from '~/styles/tokens.stylex'

import { AppSidebar } from './AppSidebar'

const styles = stylex.create({
	shell: {
		overflow: 'hidden',
		overscrollBehaviorY: 'none',

		display: 'flex',

		height: '100svh',

		backgroundColor: appShellColors.chromeBackground,
	},
	children: {
		marginBlock: {
			default: 0,
			[breakpoints.tablet]: 6,
		},
		flexGrow: 1,
		marginInlineEnd: {
			default: 0,
			[breakpoints.tablet]: 6,
		},
		minHeight: 0,
		minWidth: 0,

		position: 'relative',
		zIndex: 1,
		overflowY: 'auto',

		borderRadius: {
			default: 0,
			[breakpoints.tablet]: radii.xl,
		},
		backgroundColor: appShellColors.surfaceBackground,
		boxShadow: {
			default: 'none',
			[breakpoints.desktop]: `0 0 4px ${appShellColors.surfaceShadow}`,
		},
	},
})

type AppShellProps = {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return (
		<div {...stylex.props(styles.shell)}>
			<AppSidebar />
			<main {...stylex.props(styles.children)}>{children}</main>
		</div>
	)
}
