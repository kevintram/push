import type * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { Collapsible } from '~/components/ui'

export interface SidebarCollapsibleItemProps extends Omit<
	React.ComponentProps<typeof Collapsible>,
	'className' | 'style'
> {
	children: ReactNode
	xstyle?: stylex.StyleXStyles
}

export function SidebarCollapsibleItem({
	children,
	xstyle,
	...props
}: SidebarCollapsibleItemProps) {
	return (
		<Collapsible render={<section />} xstyle={xstyle} {...props}>
			{children}
		</Collapsible>
	)
}
