import * as stylex from '@stylexjs/stylex'
import { MoreHorizontal } from 'lucide-react'

import { iconSizes } from '~/styles/tokens.stylex'

export interface BreadcrumbEllipsisProps extends Omit<
	React.ComponentProps<'span'>,
	'aria-hidden' | 'children' | 'className' | 'role' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	ellipsis: {
		alignItems: 'center',
		blockSize: iconSizes.lg,
		display: 'flex',
		inlineSize: iconSizes.lg,
		justifyContent: 'center',
	},
	icon: {
		blockSize: iconSizes.md,
		inlineSize: iconSizes.md,
	},
})

export function BreadcrumbEllipsis({
	xstyle,
	...props
}: BreadcrumbEllipsisProps) {
	return (
		<span
			aria-hidden='true'
			data-slot='breadcrumb-ellipsis'
			role='presentation'
			{...stylex.props(styles.ellipsis, xstyle)}
			{...props}
		>
			<MoreHorizontal aria-hidden='true' {...stylex.props(styles.icon)} />
		</span>
	)
}
