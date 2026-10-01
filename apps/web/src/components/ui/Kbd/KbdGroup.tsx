import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

export interface KbdGroupProps extends Omit<
	React.ComponentProps<'kbd'>,
	'className' | 'style'
> {
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	root: {
		alignItems: 'center',
		columnGap: spacing.xs,
		display: 'inline-flex',
	},
})

export function KbdGroup({ xstyle, ...props }: KbdGroupProps) {
	return (
		<kbd
			data-slot='kbd-group'
			{...stylex.props(styles.root, xstyle)}
			{...props}
		/>
	)
}
