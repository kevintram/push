import * as stylex from '@stylexjs/stylex'
import { ChevronRight } from 'lucide-react'

import { iconSizes } from '~/styles/tokens.stylex'

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
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
		transform: {
			default: 'none',
			':dir(rtl)': 'rotate(180deg)',
		},
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
			{children ?? (
				<ChevronRight
					aria-hidden='true'
					{...stylex.props(styles.icon)}
				/>
			)}
		</li>
	)
}
