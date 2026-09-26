import * as stylex from '@stylexjs/stylex'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'

import { spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	header: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		inlineSize: '100%',
	},
})

export interface SidebarCollapsibleHeaderProps extends Omit<
	ComponentPropsWithoutRef<'div'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

export const SidebarCollapsibleHeader = forwardRef<
	HTMLDivElement,
	SidebarCollapsibleHeaderProps
>(function SidebarCollapsibleHeader({ xstyle, ...props }, ref) {
	return (
		<div
			ref={ref}
			{...stylex.props(stylex.defaultMarker(), styles.header, xstyle)}
			{...props}
		/>
	)
})
