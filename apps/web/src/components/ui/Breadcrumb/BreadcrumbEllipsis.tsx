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
	// A 24px box around the glyph.
	ellipsis: {
		alignItems: 'center',
		blockSize: '1.5rem',
		display: 'flex',
		inlineSize: '1.5rem',
		justifyContent: 'center',
	},
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
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
