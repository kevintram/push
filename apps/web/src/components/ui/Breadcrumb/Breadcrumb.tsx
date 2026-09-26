import * as stylex from '@stylexjs/stylex'

export interface BreadcrumbProps extends Omit<
	React.ComponentProps<'nav'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

export function Breadcrumb({
	'aria-label': ariaLabel = 'Breadcrumb',
	xstyle,
	...props
}: BreadcrumbProps) {
	return (
		<nav
			aria-label={ariaLabel}
			data-slot='breadcrumb'
			{...stylex.props(xstyle)}
			{...props}
		/>
	)
}
