import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { appShellColors } from '~/styles/componentColors.stylex'

import { AppSidebar } from './AppSidebar'

const styles = stylex.create({
	shell: {
		overflow: 'hidden',
		overscrollBehavior: 'none',

		backgroundColor: appShellColors.background,
		color: appShellColors.foreground,

		display: 'flex',

		height: '100svh',
	},
	children: {
		flexGrow: 1,
		minHeight: 0,
		minWidth: 0,

		overflowY: 'auto',
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
