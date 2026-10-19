import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'

export interface BreadcrumbPageProps extends Omit<
	React.ComponentProps<'span'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	page: {
		color: semanticColors.textPrimary,
	},
})

export function BreadcrumbPage({ xstyle, ...props }: BreadcrumbPageProps) {
	return (
		<span
			aria-current='page'
			data-slot='breadcrumb-page'
			{...stylex.props(styles.page, xstyle)}
			{...props}
		/>
	)
}
