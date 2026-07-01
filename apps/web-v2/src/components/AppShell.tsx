import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { colors, fonts } from '../styles/theme.stylex'

const styles = stylex.create({
	shell: {
		minHeight: '100%',
		backgroundColor: colors.background,
		color: colors.foreground,
		fontFamily: fonts.sans,
	},
})

type AppShellProps = {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return <div {...stylex.props(styles.shell)}>{children}</div>
}
