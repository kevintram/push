import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'

export interface BreadcrumbPageProps extends Omit<
	React.ComponentProps<'span'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	page: {
		color: colorsSemantic.textPrimary,
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
