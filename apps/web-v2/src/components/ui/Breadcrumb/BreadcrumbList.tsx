import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, spacing } from '~/styles/tokens.stylex'

export interface BreadcrumbListProps extends Omit<
	React.ComponentProps<'ol'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	list: {
		gap: spacing.sm,

		listStyle: 'none',
		alignItems: 'center',
		color: colors.textSecondary,
		display: 'flex',
		flexWrap: 'wrap',
		fontSize: fontSizes.sm,
		overflowWrap: 'break-word',
		paddingInlineStart: spacing.none,
	},
})

export function BreadcrumbList({ xstyle, ...props }: BreadcrumbListProps) {
	return (
		<ol
			data-slot='breadcrumb-list'
			{...stylex.props(styles.list, xstyle)}
			{...props}
		/>
	)
}
