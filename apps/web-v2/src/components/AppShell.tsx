import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { colors, fonts } from '~/styles/tokens.stylex'

import { AppSidebar } from './AppSidebar'

const styles = stylex.create({
	shell: {
		overflow: 'hidden',

		backgroundColor: colors.background,
		color: colors.foreground,

		display: 'flex',

		fontFamily: fonts.sans,

		height: '100svh',
	},
	children: {
		flexGrow: 1,
		minHeight: 0,

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
