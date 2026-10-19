import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'

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
			default: semanticColors.textInteractive,
			':hover': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
		},
		outlineColor: {
			default: semanticColors.surfaceTransparent,
			':focus-visible': semanticColors.borderFocus,
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
