import * as stylex from '@stylexjs/stylex'

export interface BreadcrumbSeparatorProps extends Omit<
	React.ComponentProps<'li'>,
	'aria-hidden' | 'children' | 'className' | 'role' | 'style'
> {
	children?: React.ReactNode
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	separator: {
		flexShrink: 0,
	},
})

export function BreadcrumbSeparator({
	children,
	xstyle,
	...props
}: BreadcrumbSeparatorProps) {
	return (
		<li
			aria-hidden='true'
			data-slot='breadcrumb-separator'
			role='presentation'
			{...stylex.props(styles.separator, xstyle)}
			{...props}
		>
			{children ?? '/'}
		</li>
	)
}
