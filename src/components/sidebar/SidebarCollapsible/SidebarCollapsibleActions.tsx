import * as stylex from '@stylexjs/stylex'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

const styles = stylex.create({
	actions: {
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
})

export interface SidebarCollapsibleActionsProps extends Omit<
	ComponentPropsWithoutRef<'div'>,
	'className' | 'style'
> {
	children: ReactNode
	xstyle?: stylex.StyleXStyles
}

export function SidebarCollapsibleActions({
	children,
	xstyle,
	...props
}: SidebarCollapsibleActionsProps) {
	return (
		<div {...stylex.props(styles.actions, xstyle)} {...props}>
			{children}
		</div>
	)
}
