import type { ReactNode } from 'react'

import * as styles from './AppShell.css'

type AppShellProps = {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return <div className={styles.shell}>{children}</div>
}
