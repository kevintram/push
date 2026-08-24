import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import {
	appRailColors,
	appShellColors,
} from '~/styles/colors/components.stylex'
import { radii } from '~/styles/tokens.stylex'

import { AppRail } from './AppRail'

const styles = stylex.create({
	shell: {
		overflow: 'hidden',
		overscrollBehavior: 'none',

		display: 'flex',

		height: '100svh',

		backgroundColor: appRailColors.background,
	},
	children: {
		marginBlock: {
			default: 0,
			'@media (min-width: 900px)': 6,
		},
		flexGrow: 1,
		marginInlineEnd: {
			default: 0,
			'@media (min-width: 900px)': 6,
		},
		minHeight: 0,
		minWidth: 0,

		position: 'relative',
		zIndex: 1,
		overflowY: 'auto',

		borderRadius: {
			default: 0,
			'@media (min-width: 900px)': radii.xl,
		},
		backgroundColor: appShellColors.surfaceBackground,
		boxShadow: {
			default: 'none',
			'@media (min-width: 900px)': `0 0 4px ${appShellColors.surfaceShadow}`,
		},
	},
})

type AppShellProps = {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return (
		<div {...stylex.props(styles.shell)}>
			<AppRail />
			<main {...stylex.props(styles.children)}>{children}</main>
		</div>
	)
}
