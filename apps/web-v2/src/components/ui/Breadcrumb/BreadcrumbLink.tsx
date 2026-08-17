import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'

export interface BreadcrumbLinkProps extends Omit<
	useRender.ComponentProps<'a'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	link: {
		textDecoration: 'none',
		color: {
			default: colors.textLink,
			':hover': colors.textLinkHover,
			':active': colors.textLinkActive,
		},
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: '150ms',
		transitionProperty: 'color',
		transitionTimingFunction: 'ease-in-out',
	},
})

export function BreadcrumbLink({
	render,
	xstyle,
	...props
}: BreadcrumbLinkProps) {
	return useRender({
		defaultTagName: 'a',
		props: mergeProps<'a'>(stylex.props(styles.link, xstyle), props),
		render,
		state: { slot: 'breadcrumb-link' },
	})
}
