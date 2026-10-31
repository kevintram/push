import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

export interface BreadcrumbItemProps extends Omit<
	React.ComponentProps<'li'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	item: {
		gap: spacing.xs,

		alignItems: 'center',
		display: 'inline-flex',
		minWidth: 0,
	},
})

export function BreadcrumbItem({ xstyle, ...props }: BreadcrumbItemProps) {
	return (
		<li
			data-slot='breadcrumb-item'
			{...stylex.props(styles.item, xstyle)}
			{...props}
		/>
	)
}
