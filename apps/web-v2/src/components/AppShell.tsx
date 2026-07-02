import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { colors, fonts } from '~/styles/tokens.stylex'

import { AppSidebar } from './AppSidebar'

const styles = stylex.create({
	shell: {
		minHeight: '100svh',
		backgroundColor: colors.background,
		color: colors.foreground,
		fontFamily: fonts.sans,
		display: 'flex',
	},
})

type AppShellProps = {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return (
		<div {...stylex.props(styles.shell)}>
			<AppSidebar />
			{children}
		</div>
	)
}
