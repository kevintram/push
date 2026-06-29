import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { styles } from './AppShell.stylex'

type AppShellProps = {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return <div {...stylex.props(styles.shell)}>{children}</div>
}
